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
  EXPLV_ZOOM_MIN,
  EXPLV_ZOOM_MAX,
  explvZoomFromScale,
  getVisibleTiles,
  osrsTileUrl,
} from "./coordinates";
import { getTileImage } from "./tileCache";
import { MapContext } from "./MapContext";
import type { OsrsCoord, OsrsMapBaseProps } from "./types";

const DEFAULT_SCALE = 4;
const SCALE_MIN = 0.25;
const SCALE_MAX = 32;
const ZOOM_WHEEL_FACTOR = 0.002;
const ZOOM_STEP = 1.5;
const RECENTER_DURATION = 800;
// Preload ±this many Explv zoom levels from the current one on every viewport change.
const PRELOAD_ZOOM_RADIUS = 3;
// Multiplier applied to both dimensions when computing which tiles to preload.
const PRELOAD_MARGIN = 2.0;
// Number of animation keyframes sampled when pre-warming tiles before recenter.
const RECENTER_PRELOAD_KEYFRAMES = 14;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeInQuad(t: number): number {
  return t * t;
}
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Loads all tiles visible from (cX, cY) at every zoom level within PRELOAD_ZOOM_RADIUS
 * of the zoom that maps to pxPerTile, using a PRELOAD_MARGIN-sized viewport.
 */
function preloadViewport(
  cX: number,
  cY: number,
  pxPerTile: number,
  planeId: number,
  W: number,
  H: number,
) {
  if (W === 0 || H === 0) return;
  const currentZ = explvZoomFromScale(pxPerTile);
  const zMin = Math.max(EXPLV_ZOOM_MIN, currentZ - PRELOAD_ZOOM_RADIUS);
  const zMax = Math.min(EXPLV_ZOOM_MAX, currentZ + PRELOAD_ZOOM_RADIUS);
  const pw = W * PRELOAD_MARGIN;
  const ph = H * PRELOAD_MARGIN;

  for (let z = zMin; z <= zMax; z++) {
    // Exact scale for this Explv zoom level: 2^(z-6)
    // (derived from scale = 32 / 2^(EXPLV_ZOOM_MAX - z) = 2^(z - 6))
    const zScale = Math.pow(2, z - 6);
    for (const t of getVisibleTiles(cX, cY, zScale, pw, ph)) {
      getTileImage(osrsTileUrl(planeId, t.explvZoom, t.tx, t.ty));
    }
  }
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
  const rafRef = useRef<number | null>(null);
  const recenterAnimRef = useRef<number | null>(null);

  const initScale = zoom !== undefined ? Math.pow(2, zoom) : DEFAULT_SCALE;
  const initCenterRef = useRef({ x: center.x, y: center.y });
  const initScaleRef = useRef(initScale);

  const [centerX, setCenterX] = useState(center.x);
  const [centerY, setCenterY] = useState(center.y);
  const [scale, setScale] = useState(initScale);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Refs mirror state so RAF callbacks always read the latest value without
  // needing state in their dependency arrays.
  const centerXRef = useRef(centerX);
  const centerYRef = useRef(centerY);
  const scaleRef   = useRef(scale);
  const sizeRef    = useRef(size);
  useEffect(() => { centerXRef.current = centerX; }, [centerX]);
  useEffect(() => { centerYRef.current = centerY; }, [centerY]);
  useEffect(() => { scaleRef.current   = scale;   }, [scale]);
  useEffect(() => { sizeRef.current    = size;    }, [size]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Mount: as soon as we have a container size, warm ALL zoom levels for the
  // initial viewport so the first interaction is already cached.
  const mountPreloaded = useRef(false);
  useEffect(() => {
    if (size.w === 0 || size.h === 0 || mountPreloaded.current) return;
    mountPreloaded.current = true;
    const { x, y } = initCenterRef.current;
    for (let z = EXPLV_ZOOM_MIN; z <= EXPLV_ZOOM_MAX; z++) {
      const zScale = Math.pow(2, z - 6);
      for (const t of getVisibleTiles(x, y, zScale, size.w * PRELOAD_MARGIN, size.h * PRELOAD_MARGIN)) {
        getTileImage(osrsTileUrl(plane, t.explvZoom, t.tx, t.ty));
      }
    }
  }, [size, plane]);

  const cancelRecenterAnim = useCallback(() => {
    if (recenterAnimRef.current !== null) {
      cancelAnimationFrame(recenterAnimRef.current);
      recenterAnimRef.current = null;
    }
  }, []);

  const drawTiles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || size.h === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size.w;
    canvas.height = size.h;
    ctx.clearRect(0, 0, size.w, size.h);

    const tiles = getVisibleTiles(centerX, centerY, scale, size.w, size.h);
    let pending = 0;

    for (const tile of tiles) {
      const url = osrsTileUrl(plane, tile.explvZoom, tile.tx, tile.ty);
      const img = getTileImage(url);

      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, tile.screenX, tile.screenY, tile.screenSize, tile.screenSize);
      } else if (!img.complete) {
        pending++;
        const onSettle = () => {
          img.removeEventListener("load", onSettle);
          img.removeEventListener("error", onSettle);
          if (--pending === 0) scheduleRedraw();
        };
        img.addEventListener("load", onSettle);
        img.addEventListener("error", onSettle);
      }
    }

    // Background: keep ±PRELOAD_ZOOM_RADIUS zoom levels warm.
    preloadViewport(centerX, centerY, scale, plane, size.w, size.h);
  }, [centerX, centerY, scale, size, plane]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleRedraw = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      drawTiles();
    });
  }, [drawTiles]);

  useEffect(() => {
    scheduleRedraw();
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [scheduleRedraw]);

  useEffect(() => {
    onViewportChange?.({ x: Math.round(centerX), y: Math.round(centerY), plane }, scale);
  }, [centerX, centerY, scale, plane, onViewportChange]);

  const recenter = useCallback(() => {
    cancelRecenterAnim();

    const fromX     = centerXRef.current;
    const fromY     = centerYRef.current;
    const fromScale = scaleRef.current;
    const toX       = initCenterRef.current.x;
    const toY       = initCenterRef.current.y;
    const toScale   = initScaleRef.current;
    const midScale  = Math.max(SCALE_MIN, toScale * 0.45);
    const { w: W, h: H } = sizeRef.current;

    // Pre-warm every tile that will be needed across the full animation path
    // before the first frame runs, so there is no mid-animation loading stall.
    for (let i = 0; i <= RECENTER_PRELOAD_KEYFRAMES; i++) {
      const t     = i / RECENTER_PRELOAD_KEYFRAMES;
      const posT  = easeInOutCubic(t);
      const kX    = lerp(fromX, toX, posT);
      const kY    = lerp(fromY, toY, posT);
      const kScale = t <= 0.4
        ? lerp(fromScale, midScale, easeInQuad(t / 0.4))
        : lerp(midScale, toScale, easeOutCubic((t - 0.4) / 0.6));
      preloadViewport(kX, kY, kScale, plane, W, H);
    }

    const startTime = performance.now();

    function step() {
      const t     = Math.min((performance.now() - startTime) / RECENTER_DURATION, 1);
      const posT  = easeInOutCubic(t);

      setCenterX(lerp(fromX, toX, posT));
      setCenterY(lerp(fromY, toY, posT));

      if (t <= 0.4) {
        setScale(lerp(fromScale, midScale, easeInQuad(t / 0.4)));
      } else {
        setScale(lerp(midScale, toScale, easeOutCubic((t - 0.4) / 0.6)));
      }

      recenterAnimRef.current = t < 1 ? requestAnimationFrame(step) : null;
    }

    recenterAnimRef.current = requestAnimationFrame(step);
  }, [cancelRecenterAnim, plane]);

  useEffect(() => () => cancelRecenterAnim(), [cancelRecenterAnim]);

  const dragRef = useRef<{
    startX: number; startY: number;
    cx: number;     cy: number;
    moved: boolean;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      cancelRecenterAnim();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX, startY: e.clientY,
        cx: centerXRef.current, cy: centerYRef.current,
        moved: false,
      };
    },
    [cancelRecenterAnim]
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
    setCenterX(drag.cx - dx / scaleRef.current);
    setCenterY(drag.cy + dy / scaleRef.current);
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag || drag.moved || !onClick) return;
      const rect = e.currentTarget.getBoundingClientRect();
      onClick({
        x: Math.round(centerXRef.current + (e.clientX - rect.left - sizeRef.current.w / 2) / scaleRef.current),
        y: Math.round(centerYRef.current - (e.clientY - rect.top  - sizeRef.current.h / 2) / scaleRef.current),
        plane,
      });
    },
    [plane, onClick]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      cancelRecenterAnim();
      const factor = 1 - e.deltaY * ZOOM_WHEEL_FACTOR;
      setScale((prev) => Math.max(SCALE_MIN, Math.min(SCALE_MAX, prev * factor)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [cancelRecenterAnim]);

  const contextValue = useMemo(
    () => ({
      centerX, centerY, scale,
      width: size.w, height: size.h,
      osrsToScreen: (coord: OsrsCoord) => ({
        x: size.w / 2 + (coord.x - centerX) * scale,
        y: size.h / 2 - (coord.y - centerY) * scale,
      }),
      screenToOsrs: (sx: number, sy: number): OsrsCoord => ({
        x: Math.round(centerX + (sx - size.w / 2) / scale),
        y: Math.round(centerY - (sy - size.h / 2) / scale),
      }),
      zoomIn:   () => { cancelRecenterAnim(); setScale((p) => Math.min(SCALE_MAX, p * ZOOM_STEP)); },
      zoomOut:  () => { cancelRecenterAnim(); setScale((p) => Math.max(SCALE_MIN, p / ZOOM_STEP)); },
      recenter,
    }),
    [centerX, centerY, scale, size, recenter, cancelRecenterAnim]
  );

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
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="absolute inset-0 pointer-events-none">{children}</div>
        <div className="absolute top-2 left-2 pointer-events-none rounded border border-border bg-background/80 px-2 py-1 font-mono text-xs text-muted-foreground">
          X: {Math.round(centerX)} Y: {Math.round(centerY)} P: {plane}
        </div>
      </div>
    </MapContext.Provider>
  );
}
