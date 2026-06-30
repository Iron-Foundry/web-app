import { type RefObject, useLayoutEffect, useState } from "react";

/**
 * Computes how many list rows fit in a container by measuring the container's
 * available height and the actual rendered height of the first item.
 * Re-measures whenever `dataLength` changes (handles loading → loaded transition).
 * `maxHeightPx` caps the effective container height so row counts stay reasonable
 * across all viewport sizes — each card derives its own item limit from the same
 * pixel budget divided by its measured row height.
 */
export function useDynamicCount(
  containerRef: RefObject<HTMLElement | null>,
  itemRef: RefObject<HTMLElement | null>,
  fallbackRowHeight: number,
  dataLength: number,
  maxHeightPx?: number,
): number {
  const [count, setCount] = useState(() =>
    typeof window !== "undefined"
      ? Math.ceil(window.innerHeight / fallbackRowHeight)
      : 30,
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const compute = () => {
      const rowH = itemRef.current?.offsetHeight ?? fallbackRowHeight;
      if (rowH <= 0) return;
      const availH = maxHeightPx
        ? Math.min(container.clientHeight, maxHeightPx)
        : container.clientHeight;
      setCount(Math.floor(availH / rowH));
    };

    const ro = new ResizeObserver(compute);
    ro.observe(container);
    compute();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLength]);

  return Math.max(count, 0);
}
