import { buildTileUrl, getVisibleTiles } from "./coordinates";
import { getTile } from "./tileCache";
import type { CoverageIndex, MapMeta } from "./mapMeta";

const MAX_ANCESTOR_LEVELS = 3;

export interface DrawParams {
  ctx: CanvasRenderingContext2D;
  meta: MapMeta;
  coverage: CoverageIndex | null;
  plane: number;
  centerX: number;
  centerY: number;
  scale: number;
  width: number;
  height: number;
  onTileReady: () => void;
}

/**
 * Draws the best already-cached ancestor tile scaled up in place of a missing
 * tile, the standard slippy-map trick that stops new areas flashing empty. The
 * ancestor is climbed until a cached one is found or the manifest floor is hit.
 */
function drawAncestor(
  ctx: CanvasRenderingContext2D,
  meta: MapMeta,
  plane: number,
  z: number,
  tx: number,
  ty: number,
  destX: number,
  destY: number,
  destSize: number,
): void {
  for (let up = 1; up <= MAX_ANCESTOR_LEVELS; up++) {
    const pz = z - up;
    if (pz < meta.minZoom) return;
    const ptx = tx >> up;
    const pty = ty >> up;
    const bitmap = getTile(buildTileUrl(meta, plane, pz, ptx, pty));
    if (!bitmap) continue;
    const frac = 1 << up;
    const sub = meta.tileSize / frac;
    const sx = (tx - (ptx << up)) * sub;
    const sy = (ty - (pty << up)) * sub;
    ctx.drawImage(bitmap, sx, sy, sub, sub, destX, destY, destSize, destSize);
    return;
  }
}

/** Renders the visible tile layer. Returns true when every tile was ready. */
export function drawTileLayer(params: DrawParams): boolean {
  const { ctx, meta, coverage, plane, centerX, centerY, scale, width, height } =
    params;
  const tiles = getVisibleTiles(
    meta,
    coverage,
    plane,
    centerX,
    centerY,
    scale,
    width,
    height,
  );
  let allReady = true;
  for (const tile of tiles) {
    const url = buildTileUrl(meta, plane, tile.z, tile.tx, tile.ty);
    const bitmap = getTile(url, params.onTileReady, "high");
    if (bitmap) {
      ctx.drawImage(bitmap, tile.screenX, tile.screenY, tile.screenSize, tile.screenSize);
      continue;
    }
    allReady = false;
    drawAncestor(
      ctx,
      meta,
      plane,
      tile.z,
      tile.tx,
      tile.ty,
      tile.screenX,
      tile.screenY,
      tile.screenSize,
    );
  }
  return allReady;
}
