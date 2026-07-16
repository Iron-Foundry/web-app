import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getPointer, subscribePointer } from "@/lib/pointerPosition";

const CURSOR_OFFSET = 16;
const EDGE_GAP = 8;

interface HoverPreviewLayerProps {
  width: number;
  height: number;
  children: React.ReactNode;
}

/**
 * Cursor-following overlay rendered into document.body. Position updates are
 * written straight to the DOM inside a rAF, so following the cursor never
 * re-renders the tree that owns the preview.
 */
export function HoverPreviewLayer({
  width,
  height,
  children,
}: HoverPreviewLayerProps): React.JSX.Element {
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    let frame = 0;
    let pendingX = 0;
    let pendingY = 0;

    const place = (x: number, y: number): void => {
      const flip = x + CURSOR_OFFSET + width > window.innerWidth;
      const left = flip ? x - width - EDGE_GAP : x + CURSOR_OFFSET;
      const top = Math.min(y - EDGE_GAP, window.innerHeight - height - EDGE_GAP);
      node.style.transform = `translate3d(${Math.max(EDGE_GAP, left)}px, ${Math.max(EDGE_GAP, top)}px, 0)`;
    };

    const initial = getPointer();
    place(initial.x, initial.y);

    const unsubscribe = subscribePointer((x, y) => {
      pendingX = x;
      pendingY = y;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        place(pendingX, pendingY);
      });
    });

    return () => {
      unsubscribe();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [width, height]);

  return createPortal(
    <div
      ref={nodeRef}
      className="fixed top-0 left-0 z-[60] pointer-events-none will-change-transform"
      style={{ width }}
    >
      {children}
    </div>,
    document.body,
  );
}
