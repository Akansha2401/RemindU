import { useEffect, useState } from "react";

/** The current time, refreshed every `intervalMs` (for greetings and dates on screen). */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
