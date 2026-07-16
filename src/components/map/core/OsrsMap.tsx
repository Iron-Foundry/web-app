import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import {
  OSRS_DEFAULT_CENTER,
  buildTileUrl,
  getVisibleTiles,
  pixelsPerTile,
  zoomFromScale,
} from "./coordinates";
import { drawTileLayer } from "./drawTiles";
import { preloadTile } from "./tileCache";
import {
  buildCoverageIndex,
  loadMapMeta,
  type CoverageIndex,
  type MapMeta,
} from "./mapMeta";
import { MapContext } from "./MapContext";
import type { OsrsCoord, OsrsMapBaseProps } from "./types";

const DEFAULT_SCALE = 4;
const ZOOM_WHEEL_FACTOR = 0.0015;
const ZOOM_STEP = 1.5;
const RECENTER_DURATION = 800;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export interface OsrsMapProps extends OsrsMapBaseProps {
  children?: ReactNode;
  onViewportChange?: (center: OsrsCoord, scale: number) => void;
  onClick?: (coord: OsrsCoord) => void;
}

export function OsrsMap({
  center = OSRS_DEFAULT_CENTER,
  zoom,
  plane = 0,
  className,
  children,
  onViewportChange,
  onClick,
}: OsrsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initScale = zoom !== undefined ? Math.pow(2, zoom) : DEFAULT_SCALE;
  const initCenterRef = useRef({ x: center.x, y: center.y });
  const initScaleRef = useRef(initScale);

  const metaRef = useRef<MapMeta | null>(null);
  const coverageRef = useRef<CoverageIndex | null>(null);

  const [view, setView] = useState({ cx: center.x, cy: center.y, scale: initScale });
  const [size, setSize] = useState({ w: 0, h: 0 });

  const centerXRef = useRef(center.x);
  const centerYRef = useRef(center.y);
  const scaleRef = useRef(initScale);
  const sizeRef = useRef(size);
  const rafRef = useRef<number | null>(null);
  const dirtyRef = useRef(true);
  const recenterRef = useRef<{ start: number; fx: number; fy: number; fs: number } | null>(null);

  useEffect(() => { sizeRef.current = size; }, [size]);

  useEffect(() => {
    let alive = true;
    loadMapMeta()
      .then((m) => {
        if (!alive) return;
        metaRef.current = m;
        coverageRef.current = m.coverage ? buildCoverageIndex(m.coverage) : null;
        markDirty();
      })
      // A missing tile backend leaves the canvas blank; the overlay layers
      // (markers, controls) still render off the map context regardless.
      .catch(() => undefined);
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scaleLimits = useCallback((): [number, number] => {
    const m = metaRef.current;
    if (!m) return [0.25, 32];
    return [pixelsPerTile(m, m.minZoom), pixelsPerTile(m, m.maxZoom) * 4];
  }, []);

  const clampCenter = useCallback(() => {
    const m = metaRef.current;
    if (!m?.bounds) return;
    centerXRef.current = clamp(centerXRef.current, m.bounds.minX, m.bounds.maxX);
    centerYRef.current = clamp(centerYRef.current, m.bounds.minY, m.bounds.maxY);
  }, []);

  const publishAndNotify = useCallback(() => {
    const cx = centerXRef.current, cy = centerYRef.current, s = scaleRef.current;
    setView((prev) =>
      prev.cx === cx && prev.cy === cy && prev.scale === s ? prev : { cx, cy, scale: s },
    );
  }, []);

  const preloadNeighbours = useCallback(() => {
    const m = metaRef.current;
    const { w, h } = sizeRef.current;
    if (!m || w === 0 || h === 0) return;
    const z = zoomFromScale(m, scaleRef.current);
    for (const dz of [-1, 1]) {
      const nz = z + dz;
      if (nz < m.minZoom || nz > m.maxZoom) continue;
      const nScale = pixelsPerTile(m, nz);
      for (const t of getVisibleTiles(m, coverageRef.current, plane, centerXRef.current, centerYRef.current, nScale, w, h)) {
        preloadTile(buildTileUrl(m, plane, t.z, t.tx, t.ty));
      }
    }
  }, [plane]);

  const drawCanvas = useCallback((): boolean => {
    const canvas = canvasRef.current, m = metaRef.current;
    const { w, h } = sizeRef.current;
    if (!canvas || !m || w === 0 || h === 0) return true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    const dpr = window.devicePixelRatio || 1;
    const dw = Math.round(w * dpr), dh = Math.round(h * dpr);
    if (canvas.width !== dw || canvas.height !== dh) { canvas.width = dw; canvas.height = dh; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    return drawTileLayer({
      ctx, meta: m, coverage: coverageRef.current, plane,
      centerX: centerXRef.current, centerY: centerYRef.current,
      scale: scaleRef.current, width: w, height: h,
      onTileReady: markDirty,
    });
  }, [plane]);

  const frame = useCallback(() => {
    rafRef.current = null;
    const anim = recenterRef.current;
    if (anim) {
      const t = Math.min((performance.now() - anim.start) / RECENTER_DURATION, 1);
      const e = easeInOutCubic(t);
      centerXRef.current = anim.fx + (initCenterRef.current.x - anim.fx) * e;
      centerYRef.current = anim.fy + (initCenterRef.current.y - anim.fy) * e;
      scaleRef.current = anim.fs + (initScaleRef.current - anim.fs) * e;
      if (t >= 1) recenterRef.current = null;
      dirtyRef.current = true;
    }
    clampCenter();
    const wasDirty = dirtyRef.current;
    dirtyRef.current = false;
    drawCanvas();
    if (wasDirty) publishAndNotify();
    // A pending tile wakes the loop again through onTileReady, so there is no
    // need to spin on unready tiles; keep looping only while a recenter animation
    // is still in flight (dirtyRef was just cleared above, so it cannot carry the
    // animation forward). Preload neighbours once the view has settled.
    if (recenterRef.current !== null) {
      ensureLoop();
    } else if (wasDirty) {
      preloadNeighbours();
    }
  }, [clampCenter, drawCanvas, publishAndNotify, preloadNeighbours]);

  const frameRef = useRef(frame);
  useEffect(() => { frameRef.current = frame; }, [frame]);

  const ensureLoop = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => frameRef.current());
    }
  }, []);
  const markDirty = useCallback(() => { dirtyRef.current = true; ensureLoop(); }, [ensureLoop]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      const w = Math.floor(r.width), h = Math.floor(r.height);
      // Update the draw-loop's ref synchronously: the passive effect that mirrors
      // `size` into `sizeRef` runs after paint, but the frame markDirty schedules
      // can fire first and would otherwise read a stale {0,0}, drawing nothing and
      // never rescheduling (the ResizeObserver only fires once on a static layout).
      sizeRef.current = { w, h };
      setSize({ w, h });
      markDirty();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [markDirty]);

  useEffect(() => { markDirty(); }, [plane, markDirty]);
  useEffect(() => () => {
    // Reset the ref, not just cancel: leaving it non-null wedges ensureLoop's
    // `rafRef.current === null` guard so no frame is ever scheduled again after a
    // remount (StrictMode's mount/unmount/remount, route change, Suspense).
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    onViewportChange?.({ x: Math.round(view.cx), y: Math.round(view.cy), plane }, view.scale);
  }, [view, plane, onViewportChange]);

  const cancelRecenter = useCallback(() => { recenterRef.current = null; }, []);
  const recenter = useCallback(() => {
    recenterRef.current = {
      start: performance.now(),
      fx: centerXRef.current, fy: centerYRef.current, fs: scaleRef.current,
    };
    markDirty();
  }, [markDirty]);

  const zoomAt = useCallback((factor: number, px: number, py: number) => {
    const { w, h } = sizeRef.current;
    const [lo, hi] = scaleLimits();
    const old = scaleRef.current;
    const next = clamp(old * factor, lo, hi);
    const wx = centerXRef.current + (px - w / 2) / old;
    const wy = centerYRef.current - (py - h / 2) / old;
    centerXRef.current = wx - (px - w / 2) / next;
    centerYRef.current = wy + (py - h / 2) / next;
    scaleRef.current = next;
    markDirty();
  }, [markDirty, scaleLimits]);

  const dragRef = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null);
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    cancelRecenter();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, cx: centerXRef.current, cy: centerYRef.current, moved: false };
  }, [cancelRecenter]);
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
    centerXRef.current = drag.cx - dx / scaleRef.current;
    centerYRef.current = drag.cy + dy / scaleRef.current;
    markDirty();
  }, [markDirty]);
  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.moved || !onClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onClick({
      x: Math.round(centerXRef.current + (e.clientX - rect.left - sizeRef.current.w / 2) / scaleRef.current),
      y: Math.round(centerYRef.current - (e.clientY - rect.top - sizeRef.current.h / 2) / scaleRef.current),
      plane,
    });
  }, [plane, onClick]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      cancelRecenter();
      const rect = el.getBoundingClientRect();
      zoomAt(1 - e.deltaY * ZOOM_WHEEL_FACTOR, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [cancelRecenter, zoomAt]);

  const contextValue = useMemo(() => ({
    centerX: view.cx, centerY: view.cy, scale: view.scale,
    width: size.w, height: size.h,
    osrsToScreen: (coord: OsrsCoord) => ({
      x: size.w / 2 + (coord.x - view.cx) * view.scale,
      y: size.h / 2 - (coord.y - view.cy) * view.scale,
    }),
    screenToOsrs: (sx: number, sy: number): OsrsCoord => ({
      x: Math.round(view.cx + (sx - size.w / 2) / view.scale),
      y: Math.round(view.cy - (sy - size.h / 2) / view.scale),
    }),
    zoomIn: () => { cancelRecenter(); zoomAt(ZOOM_STEP, size.w / 2, size.h / 2); },
    zoomOut: () => { cancelRecenter(); zoomAt(1 / ZOOM_STEP, size.w / 2, size.h / 2); },
    recenter,
  }), [view, size, recenter, cancelRecenter, zoomAt]);

  return (
    <MapContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn("relative overflow-hidden select-none bg-background", className)}
        style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ imageRendering: "pixelated" }} />
        <div className="absolute inset-0 pointer-events-none">{children}</div>
        <div className="absolute top-2 left-2 pointer-events-none rounded border border-border bg-background/80 px-2 py-1 font-mono text-xs text-muted-foreground">
          X: {Math.round(view.cx)} Y: {Math.round(view.cy)} P: {plane}
        </div>
      </div>
    </MapContext.Provider>
  );
}
