import { useEffect, useRef, useState } from "react";

const TICK_MS = 1_000;

/**
 * A clock that advances once a second while enabled.
 *
 * A self-scheduling timeout rather than an interval: the next tick is only
 * queued once the current render has happened, so a busy tab cannot pile ticks
 * up behind each other or drift.
 */
export function useNowTick(enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const tick = (): void => {
      if (cancelled) return;
      setNow(Date.now());
      timerRef.current = setTimeout(tick, TICK_MS);
    };
    timerRef.current = setTimeout(tick, TICK_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled]);

  return now;
}
