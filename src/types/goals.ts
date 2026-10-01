import type { Database } from "./database";

export type Goal = Database["public"]["Tables"]["goals"]["Row"];

export type NewGoal = {
  text: string;
  why: string;
  /** null = an open-ended goal, not a challenge */
  challengeDays: number | null;
};

export type Profile = {
  id: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  provider: string | null;
  memberSince: string;
};
