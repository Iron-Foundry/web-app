type PointerListener = (x: number, y: number) => void;

const listeners = new Set<PointerListener>();
let lastX = 0;
let lastY = 0;

function handlePointerMove(event: PointerEvent): void {
  lastX = event.clientX;
  lastY = event.clientY;
  for (const listener of listeners) listener(lastX, lastY);
}

/**
 * Subscribe to the global pointer position without triggering React renders.
 * Listeners are called on every pointermove; keep them cheap and imperative.
 */
export function subscribePointer(listener: PointerListener): () => void {
  if (listeners.size === 0) {
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("pointermove", handlePointerMove);
    }
  };
}

/** Last known pointer position in viewport coordinates. */
export function getPointer(): { x: number; y: number } {
  return { x: lastX, y: lastY };
}
