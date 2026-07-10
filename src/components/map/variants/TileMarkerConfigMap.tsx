import { useMemo, useState } from "react";
import { OsrsMap } from "../core/OsrsMap";
import { OsrsControls } from "../ui/OsrsControls";
import { OsrsPopup } from "../ui/OsrsPopup";
import { useMapContext } from "../core/MapContext";
import type { OsrsMapBaseProps } from "../core/types";
import type { TileMarkerData } from "@/types/runeliteConfig";
import {
  squaresCenter,
  tileMarkersToSquares,
  type OsrsTileSquare,
} from "../runeliteTiles";

const DEFAULT_ZOOM = 3;

function TileSquareLayer({ squares }: { squares: OsrsTileSquare[] }) {
  const { osrsToScreen, scale } = useMapContext();
  const [active, setActive] = useState<number | null>(null);
  const side = Math.max(2, scale);

  return (
    <>
      {squares.map((square, i) => {
        const { x, y } = osrsToScreen(square.coord);
        const isActive = active === i;
        return (
          <div key={i}>
            <button
              className="absolute pointer-events-auto border border-black/50"
              style={{
                left: x - side / 2,
                top: y - side / 2,
                width: side,
                height: side,
                backgroundColor: square.color,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (square.label) setActive(isActive ? null : i);
              }}
              aria-label={square.label ?? `tile ${square.coord.x},${square.coord.y}`}
            />
            {isActive && square.label && (
              <OsrsPopup
                coord={square.coord}
                label={square.label}
                onClose={() => setActive(null)}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export interface TileMarkerConfigMapProps extends OsrsMapBaseProps {
  markers: TileMarkerData[];
}

/**
 * Read-only OSRS map rendering RuneLite tile markers as filled game-tile squares.
 * Converts region coordinates and ARGB colors, and auto-centers on the marker set.
 */
export function TileMarkerConfigMap({
  markers,
  center,
  zoom,
  plane,
  ...mapProps
}: TileMarkerConfigMapProps) {
  const squares = useMemo(() => tileMarkersToSquares(markers), [markers]);
  const resolvedCenter = center ?? squaresCenter(squares);
  const resolvedPlane = plane ?? markers[0]?.z ?? 0;

  return (
    <OsrsMap
      center={resolvedCenter}
      zoom={zoom ?? DEFAULT_ZOOM}
      plane={resolvedPlane}
      {...mapProps}
    >
      <TileSquareLayer squares={squares} />
      <OsrsControls />
    </OsrsMap>
  );
}
