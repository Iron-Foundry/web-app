import { useLayoutEffect, useRef, useState } from "react";
import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";

export const GRID_GAP = 12;
const ROW_HEIGHT = 92;
const OVERSCAN_ROWS = 3;

function columnsForWidth(width: number): number {
  if (width >= 1024) return 10;
  if (width >= 768) return 8;
  if (width >= 640) return 6;
  return 4;
}

export interface VirtualLaneGrid {
  containerRef: React.RefObject<HTMLDivElement | null>;
  virtualizer: Virtualizer<Element, Element>;
  itemWidth: number;
  scrollMargin: number;
  ready: boolean;
}

/**
 * Lane-based virtualization for an icon grid that scrolls inside an ancestor.
 * The grid sits below a toolbar, so the virtualizer is given the container's
 * offset within the scroll element as scrollMargin - without it the visible
 * range is shifted and rows blank out while scrolling.
 */
export function useVirtualLaneGrid(
  count: number,
  scrollElement: Element | null,
): VirtualLaneGrid {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(() => columnsForWidth(window.innerWidth));
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const measure = (): void => {
      const rect = node.getBoundingClientRect();
      setContainerWidth((prev) => (Math.abs(prev - rect.width) < 0.5 ? prev : rect.width));
      setColumns((prev) => {
        const next = columnsForWidth(window.innerWidth);
        return next === prev ? prev : next;
      });
      if (!scrollElement) return;
      const offset =
        rect.top - scrollElement.getBoundingClientRect().top + scrollElement.scrollTop;
      setScrollMargin((prev) => (Math.abs(prev - offset) < 0.5 ? prev : offset));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (scrollElement) observer.observe(scrollElement);
    return () => observer.disconnect();
  }, [scrollElement]);

  const virtualizer = useVirtualizer<Element, Element>({
    count,
    lanes: columns,
    getScrollElement: () => scrollElement,
    estimateSize: () => ROW_HEIGHT,
    overscan: columns * OVERSCAN_ROWS,
    scrollMargin,
  });

  const itemWidth =
    columns > 0 ? (containerWidth - GRID_GAP * (columns - 1)) / columns : 0;

  return { containerRef, virtualizer, itemWidth, scrollMargin, ready: containerWidth > 0 };
}
