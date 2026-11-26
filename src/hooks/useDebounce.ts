import { useEffect, useState } from "react";

/** How long a search box waits after the last keystroke before it searches. */
export const SEARCH_SETTLE_MS = 400;

/** The value as it stood once it stopped changing for `delay` milliseconds. */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
