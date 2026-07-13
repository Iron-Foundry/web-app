import { useCallback, useRef, useState } from "react";

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface ZoomPan {
  transform: Transform;
  reset: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function clampPan(value: number, viewport: number, scale: number): number {
  return Math.min(0, Math.max(viewport * (1 - scale), value));
}

function clampTransform(t: Transform, width: number, height: number): Transform {
  return {
    scale: t.scale,
    x: clampPan(t.x, width, t.scale),
    y: clampPan(t.y, height, t.scale),
  };
}

interface ZoomPanOptions {
  leftButtonPans?: boolean;
}

export function useZoomPan(options: ZoomPanOptions = {}): ZoomPan {
  const { leftButtonPans = true } = options;
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const reset = useCallback(() => setTransform({ x: 0, y: 0, scale: 1 }), []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setTransform((t) => {
      const next = clampScale(t.scale * Math.exp(-e.deltaY * 0.0007));
      const ratio = next / t.scale;
      return clampTransform(
        {
          scale: next,
          x: px - (px - t.x) * ratio,
          y: py - (py - t.y) * ratio,
        },
        rect.width,
        rect.height,
      );
    });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!leftButtonPans && e.button === 0) return;
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [leftButtonPans],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setTransform((t) =>
      clampTransform({ ...t, x: t.x + dx, y: t.y + dy }, rect.width, rect.height),
    );
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return { transform, reset, onWheel, onPointerDown, onPointerMove, onPointerUp };
}
