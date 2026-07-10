import { API_URL } from "@/context/AuthContext";
import type { OsrsCoord } from "./types";

export const EXPLV_ZOOM_MIN = 4;
export const EXPLV_ZOOM_MAX = 11;

const MAP_HEIGHT_AT_MAX_ZOOM = 364544;
const MAP_WIDTH_AT_MAX_ZOOM = 104448;

const RS_OFFSET_X = 960;
const RS_OFFSET_Y = 6208;
const RS_TILE_PX = 32;

// Pixel y at Leaflet maxZoom for osrsY=0:
// pixel_y = MAP_HEIGHT_AT_MAX_ZOOM - (osrsY - RS_OFFSET_Y) * RS_TILE_PX
//         = MAP_HEIGHT_AT_MAX_ZOOM + RS_OFFSET_Y * RS_TILE_PX  (at osrsY=0)
// Tile y index: tyXyz = floor(pixel_y / 256 / 2^(maxZoom-z))
//             = floor((MAP_HEIGHT_AT_MAX_ZOOM/RS_TILE_PX + RS_OFFSET_Y - osrsY) / tilesPerImage)
//             = floor((PY_CONST - osrsY) / tilesPerImage)
const PY_CONST = MAP_HEIGHT_AT_MAX_ZOOM / RS_TILE_PX + RS_OFFSET_Y; // = 17600

export const OSRS_DEFAULT_CENTER: OsrsCoord = { x: 3233, y: 3222, plane: 0 };

export function osrsTilesPerImage(explvZoom: number): number {
  return Math.pow(2, 14 - explvZoom);
}

export function explvZoomFromScale(pixelsPerGameTile: number): number {
  const raw = Math.round(6 + Math.log2(pixelsPerGameTile));
  return Math.max(EXPLV_ZOOM_MIN, Math.min(EXPLV_ZOOM_MAX, raw));
}

/**
 * Converts OSRS game coordinates to screen (CSS pixel) position within the container.
 * OSRS y increases northward; screen y increases downward — hence the negation.
 */
export function osrsToScreen(
  coord: OsrsCoord,
  centerX: number,
  centerY: number,
  pixelsPerGameTile: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  return {
    x: containerWidth / 2 + (coord.x - centerX) * pixelsPerGameTile,
    y: containerHeight / 2 - (coord.y - centerY) * pixelsPerGameTile,
  };
}

export function screenToOsrs(
  screenX: number,
  screenY: number,
  centerX: number,
  centerY: number,
  pixelsPerGameTile: number,
  containerWidth: number,
  containerHeight: number
): OsrsCoord {
  return {
    x: Math.round(centerX + (screenX - containerWidth / 2) / pixelsPerGameTile),
    y: Math.round(centerY - (screenY - containerHeight / 2) / pixelsPerGameTile),
  };
}

export interface VisibleTile {
  tx: number;
  ty: number;
  explvZoom: number;
  screenX: number;
  screenY: number;
  screenSize: number;
}

/**
 * Computes which Explv tile images are visible in the viewport.
 *
 * Explv uses Leaflet with tms:true and EPSG3857. The pixel y at maxZoom is:
 *   pixel_y = MAP_HEIGHT_AT_MAX_ZOOM - (osrsY - RS_OFFSET_Y) * 32
 *           = (PY_CONST - osrsY) * 32    where PY_CONST = 17600
 *
 * Tile XYZ index:  tyXyz = floor(pixel_y_at_z / 256) = floor((PY_CONST - osrsY) / tilesPerImage)
 * TMS y (url):     tyTms = 2^z - 1 - tyXyz   (Leaflet tms:true uses full world size, not repo rows)
 *
 * Tiles exist in the repository for tyTms in [0, tileRowsAtZoom-1].
 */
export function getVisibleTiles(
  centerX: number,
  centerY: number,
  pixelsPerGameTile: number,
  containerWidth: number,
  containerHeight: number
): VisibleTile[] {
  const explvZoom = explvZoomFromScale(pixelsPerGameTile);
  const tilesPerImage = osrsTilesPerImage(explvZoom);
  const tileDisplaySize = tilesPerImage * pixelsPerGameTile;
  const worldTiles = Math.pow(2, explvZoom);

  const halfW = containerWidth / 2 / pixelsPerGameTile;
  const halfH = containerHeight / 2 / pixelsPerGameTile;

  // Tile index range covering the viewport
  const txMin = Math.floor((centerX - RS_OFFSET_X - halfW) / tilesPerImage);
  const txMax = Math.ceil((centerX - RS_OFFSET_X + halfW) / tilesPerImage);
  // In Leaflet pixel space, tyXyz increases southward (decreasing OSRS y)
  const centerTileY = PY_CONST - centerY; // in OSRS-tile units from Leaflet y-origin
  const tyXyzMin = Math.floor((centerTileY - halfH) / tilesPerImage);
  const tyXyzMax = Math.ceil((centerTileY + halfH) / tilesPerImage);

  // Tile files in the repository span these TMS y indices: [0, tileRowsAtZoom-1]
  const tileRowsAtZoom = Math.ceil(
    MAP_HEIGHT_AT_MAX_ZOOM / 256 / Math.pow(2, EXPLV_ZOOM_MAX - explvZoom)
  );
  const tileColsAtZoom = Math.ceil(
    MAP_WIDTH_AT_MAX_ZOOM / 256 / Math.pow(2, EXPLV_ZOOM_MAX - explvZoom)
  );

  const tiles: VisibleTile[] = [];

  for (let tx = txMin; tx <= txMax; tx++) {
    for (let tyXyz = tyXyzMin; tyXyz <= tyXyzMax; tyXyz++) {
      // Leaflet tms:true: url_y = 2^z - 1 - xyz_y (uses full world tile count)
      const tyTms = worldTiles - 1 - tyXyz;

      if (tx < 0 || tx >= tileColsAtZoom) continue;
      if (tyTms < 0 || tyTms >= tileRowsAtZoom) continue;

      // Screen position of tile top-left corner
      // Tile x corresponds to OSRS x = tx * tilesPerImage + RS_OFFSET_X
      // Tile y-top corresponds to OSRS y = PY_CONST - tyXyz * tilesPerImage
      const screenX =
        containerWidth / 2 + (tx * tilesPerImage - (centerX - RS_OFFSET_X)) * pixelsPerGameTile;
      const screenY =
        containerHeight / 2 + (tyXyz * tilesPerImage - centerTileY) * pixelsPerGameTile;

      tiles.push({ tx, ty: tyTms, explvZoom, screenX, screenY, screenSize: tileDisplaySize });
    }
  }

  return tiles;
}

export function osrsTileUrl(
  plane: number,
  explvZoom: number,
  tx: number,
  ty: number
): string {
  const base = API_URL.replace(/\/$/, "");
  return `${base}/tiles/${plane}/${explvZoom}/${tx}/${ty}`;
}
