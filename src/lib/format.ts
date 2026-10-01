/** Countdown text: 1:24:10, or 24:10 under an hour. */
export function formatCountdown(totalSec: number) {
  const s = Math.max(0, Math.ceil(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Duration text: "3h 12m", "45m", "<1m". */
export function formatDuration(ms: number) {
  const totalMin = Math.round(ms / 60_000);
  if (ms > 0 && totalMin < 1) return "<1m";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** "9 PM", "12 AM" for an hour 0–23. */
export function formatHour(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
}

/** "10:42 AM" in the phone's locale. */
export function formatClock(at: number) {
  return new Date(at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** "Wednesday, 1 October" in the phone's locale. */
export function formatLongDate(at: number) {
  return new Date(at).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

/** "1 Oct" / "1 Oct 2025" (year only when it isn't this year). */
export function formatShortDate(at: number | string, now = Date.now()) {
  const d = new Date(at);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}
