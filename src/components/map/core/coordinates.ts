import type { OsrsCoord } from "./types";
import {
  type CoverageIndex,
  type MapMeta,
  regionCovered,
} from "./mapMeta";

export const OSRS_DEFAULT_CENTER: OsrsCoord = { x: 3233, y: 3222, plane: 0 };

/** Pixels drawn per game tile at a zoom level, from the manifest. */
export function pixelsPerTile(meta: MapMeta, z: number): number {
  return meta.pixelsPerTile[z - meta.minZoom]!;
}

/** Game tiles spanned by one 256px XYZ tile at a zoom level. */
export function gameTilesPerTile(meta: MapMeta, z: number): number {
  return meta.tileSize / pixelsPerTile(meta, z);
}

/** Number of XYZ tiles per axis at a zoom level. */
export function tilesPerAxis(meta: MapMeta, z: number): number {
  return meta.worldTiles / gameTilesPerTile(meta, z);
}

/**
 * Picks the tile zoom whose native pixels-per-tile best matches the current
 * render scale, clamped to the manifest's zoom range. Driven entirely off the
 * manifest so no zoom constant is hard-coded client-side.
 */
export function zoomFromScale(meta: MapMeta, scale: number): number {
  const ppt0 = pixelsPerTile(meta, meta.minZoom);
  const raw = Math.round(Math.log2(scale) - Math.log2(ppt0)) + meta.minZoom;
  return Math.max(meta.minZoom, Math.min(meta.maxZoom, raw));
}

export function buildTileUrl(
  meta: MapMeta,
  plane: number,
  z: number,
  tx: number,
  ty: number,
): string {
  return meta.tileUrl
    .replace("{plane}", String(plane))
    .replace("{z}", String(z))
    .replace("{x}", String(tx))
    .replace("{y}", String(ty));
}

/** True if any region overlapping this tile exists on the plane. */
export function tileCovered(
  meta: MapMeta,
  index: CoverageIndex,
  z: number,
  plane: number,
  tx: number,
  ty: number,
): boolean {
  const gtpt = gameTilesPerTile(meta, z);
  const axis = tilesPerAxis(meta, z);
  const size = meta.regionSize;
  const x0 = tx * gtpt;
  const yFloor = axis - 1 - ty;
  const y0 = yFloor * gtpt;
  const rxMin = Math.floor(x0 / size);
  const rxMax = Math.floor((x0 + gtpt - 1) / size);
  const ryMin = Math.floor(y0 / size);
  const ryMax = Math.floor((y0 + gtpt - 1) / size);
  for (let rx = rxMin; rx <= rxMax; rx++) {
    for (let ry = ryMin; ry <= ryMax; ry++) {
      if (regionCovered(index, plane, rx, ry)) return true;
    }
  }
  return false;
}

export interface VisibleTile {
  tx: number;
  ty: number;
  z: number;
  screenX: number;
  screenY: number;
  screenSize: number;
}

/**
 * The XYZ tiles covering the viewport. XYZ y grows south while game y grows
 * north, so the row flip is `tilesPerAxis - 1 - floor(worldY / gameTilesPerTile)`.
 * Tiles whose regions do not exist (per the coverage bitmap) are skipped.
 */
export function getVisibleTiles(
  meta: MapMeta,
  coverage: CoverageIndex | null,
  plane: number,
  centerX: number,
  centerY: number,
  scale: number,
  width: number,
  height: number,
): VisibleTile[] {
  if (width === 0 || height === 0) return [];
  const z = zoomFromScale(meta, scale);
  const gtpt = gameTilesPerTile(meta, z);
  const axis = tilesPerAxis(meta, z);
  const displaySize = gtpt * scale;

  const halfW = width / 2 / scale;
  const halfH = height / 2 / scale;
  const worldLeft = centerX - halfW;
  const worldRight = centerX + halfW;
  const worldBottom = centerY - halfH;
  const worldTop = centerY + halfH;

  const txMin = Math.floor(worldLeft / gtpt);
  const txMax = Math.floor(worldRight / gtpt);
  const tyMin = axis - 1 - Math.floor(worldTop / gtpt);
  const tyMax = axis - 1 - Math.floor(worldBottom / gtpt);

  const tiles: VisibleTile[] = [];
  for (let tx = txMin; tx <= txMax; tx++) {
    if (tx < 0 || tx >= axis) continue;
    for (let ty = tyMin; ty <= tyMax; ty++) {
      if (ty < 0 || ty >= axis) continue;
      if (coverage && !tileCovered(meta, coverage, z, plane, tx, ty)) continue;
      const tileLeftWorldX = tx * gtpt;
      const tileTopWorldY = (axis - ty) * gtpt;
      tiles.push({
        tx,
        ty,
        z,
        screenX: width / 2 + (tileLeftWorldX - centerX) * scale,
        screenY: height / 2 - (tileTopWorldY - centerY) * scale,
        screenSize: displaySize,
      });
    }
  }
  return tiles;
}

/**
 * Converts OSRS game coordinates to screen (CSS pixel) position within the
 * container. OSRS y increases northward; screen y increases downward.
 */
export function osrsToScreen(
  coord: OsrsCoord,
  centerX: number,
  centerY: number,
  scale: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: width / 2 + (coord.x - centerX) * scale,
    y: height / 2 - (coord.y - centerY) * scale,
  };
}

export function screenToOsrs(
  screenX: number,
  screenY: number,
  centerX: number,
  centerY: number,
  scale: number,
  width: number,
  height: number,
): OsrsCoord {
  return {
    x: Math.round(centerX + (screenX - width / 2) / scale),
    y: Math.round(centerY - (screenY - height / 2) / scale),
  };
}
