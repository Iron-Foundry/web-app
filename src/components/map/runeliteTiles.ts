import type { OsrsCoord } from "./core/types";
import type { TileMarkerData } from "@/types/runeliteConfig";

export interface OsrsTileSquare {
  coord: OsrsCoord;
  color: string;
  label?: string;
}

export function regionToOsrs(marker: TileMarkerData): OsrsCoord {
  return {
    x: (marker.regionId >> 8) * 64 + marker.regionX,
    y: (marker.regionId & 0xff) * 64 + marker.regionY,
    plane: marker.z,
  };
}

const DEFAULT_COLOR = "rgba(255, 255, 255, 1)";

export function argbToCss(argb: unknown): string {
  if (argb && typeof argb === "object" && "value" in argb) {
    return argbToCss((argb as { value: unknown }).value);
  }
  if (typeof argb === "number") {
    const value = argb >>> 0;
    const alpha = ((value >>> 24) & 0xff) / 255;
    return `rgba(${(value >>> 16) & 0xff}, ${(value >>> 8) & 0xff}, ${value & 0xff}, ${Number(alpha.toFixed(3))})`;
  }
  if (typeof argb !== "string") return DEFAULT_COLOR;
  const hex = argb.replace(/^#/, "");
  if (hex.length !== 8) return argb;
  const alpha = parseInt(hex.slice(0, 2), 16) / 255;
  const red = parseInt(hex.slice(2, 4), 16);
  const green = parseInt(hex.slice(4, 6), 16);
  const blue = parseInt(hex.slice(6, 8), 16);
  return `rgba(${red}, ${green}, ${blue}, ${Number(alpha.toFixed(3))})`;
}

export function tileMarkersToSquares(data: TileMarkerData[]): OsrsTileSquare[] {
  return data.map((marker) => ({
    coord: regionToOsrs(marker),
    color: argbToCss(marker.color),
    label: marker.label,
  }));
}

export function squaresCenter(squares: OsrsTileSquare[]): OsrsCoord | undefined {
  if (squares.length === 0) return undefined;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const square of squares) {
    minX = Math.min(minX, square.coord.x);
    maxX = Math.max(maxX, square.coord.x);
    minY = Math.min(minY, square.coord.y);
    maxY = Math.max(maxY, square.coord.y);
  }
  return {
    x: Math.round((minX + maxX) / 2),
    y: Math.round((minY + maxY) / 2),
    plane: squares[0]?.coord.plane,
  };
}
