import { API_URL } from "@/context/AuthContext";

/**
 * The /map/meta manifest served by osrs-cache-service (proxied through
 * api-backend). It is the single source of the coordinate contract: tile size,
 * zoom range, pixels-per-game-tile per zoom, the world extent, and a coverage
 * bitmap of which regions actually exist so the client never fetches a tile that
 * is not there.
 */
export interface MapCoverage {
  regionMinX: number;
  regionMinY: number;
  regionWidth: number;
  regionHeight: number;
  planeBits: string[];
}

export interface MapBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface MapMeta {
  build: number;
  tileSize: number;
  minZoom: number;
  maxZoom: number;
  baseZoom: number;
  worldTiles: number;
  regionSize: number;
  planes: number;
  pixelsPerTile: number[];
  scheme: string;
  format: string;
  tileUrl: string;
  bounds: MapBounds | null;
  coverage: MapCoverage | null;
}

/** Decoded coverage: one Uint8Array bitmap per plane, plus the grid origin. */
export interface CoverageIndex {
  regionMinX: number;
  regionMinY: number;
  regionWidth: number;
  regionHeight: number;
  planes: Uint8Array[];
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function buildCoverageIndex(coverage: MapCoverage): CoverageIndex {
  return {
    regionMinX: coverage.regionMinX,
    regionMinY: coverage.regionMinY,
    regionWidth: coverage.regionWidth,
    regionHeight: coverage.regionHeight,
    planes: coverage.planeBits.map(decodeBase64),
  };
}

/** Whether a region exists on a plane, per the coverage bitmap. */
export function regionCovered(
  index: CoverageIndex,
  plane: number,
  regionX: number,
  regionY: number,
): boolean {
  const bits = index.planes[plane];
  if (!bits) return false;
  const col = regionX - index.regionMinX;
  const row = regionY - index.regionMinY;
  if (col < 0 || row < 0 || col >= index.regionWidth || row >= index.regionHeight) {
    return false;
  }
  const bit = row * index.regionWidth + col;
  return (bits[bit >> 3]! & (1 << (bit & 7))) !== 0;
}

let metaPromise: Promise<MapMeta> | null = null;

/**
 * Fetches and caches the manifest for the session. A failed fetch clears the
 * cache so a later mount retries rather than being stuck on a rejected promise
 * (e.g. the tile backend was momentarily down).
 */
export function loadMapMeta(): Promise<MapMeta> {
  if (!metaPromise) {
    const base = API_URL.replace(/\/$/, "");
    metaPromise = fetch(`${base}/osrs-cache/map/meta`)
      .then((r) => {
        if (!r.ok) throw new Error(`map/meta ${r.status}`);
        return r.json() as Promise<MapMeta>;
      })
      .catch((err) => {
        metaPromise = null;
        throw err;
      });
  }
  return metaPromise;
}
