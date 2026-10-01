import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { authStore$ } from "@/store/auth.store";
import { setup$ } from "@/store/setup.store";
import type { Goal, NewGoal } from "@/types/goals";

export const goalKeys = { all: ["goals"] as const };

function userId() {
  const id = authStore$.userId.peek();
  if (!id) throw new Error("Not signed in");
  return id;
}

async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Only one goal can be the focus (a partial unique index), so the old one is retired first. */
async function retireActive() {
  const { error } = await supabase.from("goals").update({ is_active: false }).eq("user_id", userId()).eq("is_active", true);
  if (error) throw error;
}

/** The focus goal is what new timers and the "time's up" screen show. */
function applySessionGoal(goal: Pick<Goal, "text" | "why">) {
  setup$.assign({ goal: goal.text, why: goal.why ?? "" });
}

async function createGoal({ goal, focus }: { goal: NewGoal; focus: boolean }) {
  if (focus) await retireActive();
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId(),
      text: goal.text.trim(),
      why: goal.why.trim() || null,
      challenge_days: goal.challengeDays,
      is_active: focus,
    })
    .select()
    .single();
  if (error) throw error;
  if (focus) applySessionGoal(data);
  return data;
}

async function setFocus(goal: Goal) {
  await retireActive();
  const { error } = await supabase.from("goals").update({ is_active: true, completed_at: null }).eq("id", goal.id);
  if (error) throw error;
  applySessionGoal(goal);
}

async function completeGoal(goal: Goal) {
  const { error } = await supabase
    .from("goals")
    .update({ completed_at: new Date().toISOString(), is_active: false })
    .eq("id", goal.id);
  if (error) throw error;
}

async function deleteGoal(goal: Goal) {
  const { error } = await supabase.from("goals").delete().eq("id", goal.id);
  if (error) throw error;
}

export function useGoals() {
  return useQuery({ queryKey: goalKeys.all, queryFn: fetchGoals });
}

function useGoalMutation<T>(fn: (arg: T) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => client.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export const useCreateGoal = () => useGoalMutation(createGoal);
export const useSetFocus = () => useGoalMutation(setFocus);
export const useCompleteGoal = () => useGoalMutation(completeGoal);
export const useDeleteGoal = () => useGoalMutation(deleteGoal);

/** Day N of a challenge (1-based), capped at its length. */
export function challengeDay(goal: Pick<Goal, "created_at" | "challenge_days">, now = Date.now()) {
  if (!goal.challenge_days) return null;
  const start = new Date(goal.created_at);
  start.setHours(0, 0, 0, 0);
  const day = Math.floor((now - start.getTime()) / 86_400_000) + 1;
  return Math.min(goal.challenge_days, Math.max(1, day));
}
