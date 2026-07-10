import { createContext, useContext } from "react";
import type { OsrsCoord } from "./types";

export interface MapViewport {
  centerX: number;
  centerY: number;
  scale: number;
  width: number;
  height: number;
}

interface MapContextValue extends MapViewport {
  osrsToScreen: (coord: OsrsCoord) => { x: number; y: number };
  screenToOsrs: (sx: number, sy: number) => OsrsCoord;
  zoomIn: () => void;
  zoomOut: () => void;
  recenter: () => void;
}

export const MapContext = createContext<MapContextValue | null>(null);

/**
 * Returns the current OSRS map viewport, coordinate conversion utilities, and zoom controls.
 * Must be called from a component rendered inside OsrsMap.
 */
export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used inside OsrsMap");
  return ctx;
}
