import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { subscribePointer } from "@/lib/pointerPosition";

const HOVER_DELAY_MS = 400;

export interface HoverPreview<T> {
  target: T | null;
  start: (value: T) => void;
  end: () => void;
}

/**
 * Hover-intent state for a preview overlay. The target only changes once per
 * hover, so grids re-render on hover rather than on every pointer move -
 * the overlay itself follows the cursor imperatively via HoverPreviewLayer.
 */
export function useHoverPreview<T>(): HoverPreview<T> {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [target, setTarget] = useState<T | null>(null);

  useEffect(() => subscribePointer(() => {}), []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const end = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTarget((prev) => (prev === null ? prev : null));
  }, []);

  const start = useCallback((value: T) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setTarget(value), HOVER_DELAY_MS);
  }, []);

  return useMemo(() => ({ target, start, end }), [target, start, end]);
}
