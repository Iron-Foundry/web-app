import { useState } from "react";
import { MapPin, Crosshair } from "lucide-react";
import { OsrsMap } from "../core/OsrsMap";
import { OsrsControls } from "../ui/OsrsControls";
import { useMapContext } from "../core/MapContext";
import type { OsrsMapBaseProps, OsrsCoord } from "../core/types";

interface AdminOverlayProps {
  selected: OsrsCoord | null;
}

function AdminOverlay({ selected }: AdminOverlayProps) {
  const { osrsToScreen } = useMapContext();

  if (!selected) return null;
  const { x, y } = osrsToScreen(selected);

  return (
    <div
      className="absolute pointer-events-none -translate-x-1/2 -translate-y-full"
      style={{ left: x, top: y }}
    >
      <MapPin
        className="drop-shadow-md text-primary"
        style={{ fill: "hsl(42 80% 55% / 0.7)" }}
        size={28}
      />
    </div>
  );
}

interface CoordDisplayProps {
  coord: OsrsCoord | null;
}

function CoordDisplay({ coord }: CoordDisplayProps) {
  return (
    <div className="absolute top-2 left-2 pointer-events-none z-10">
      <div className="flex items-center gap-1.5 rounded border border-border bg-popover/90 px-2 py-1 text-xs font-mono text-muted-foreground shadow">
        <Crosshair className="h-3 w-3 text-primary" />
        {coord ? (
          <span className="text-foreground">
            {coord.x}, {coord.y}
            {coord.plane ? `, p${coord.plane}` : ""}
          </span>
        ) : (
          <span>click to place</span>
        )}
      </div>
    </div>
  );
}

export interface AdminMapProps extends OsrsMapBaseProps {
  value?: OsrsCoord | null;
  onCoordSelect: (coord: OsrsCoord) => void;
}

/**
 * Interactive OSRS map for staff/admin coordinate selection.
 * Click anywhere to place a pin and emit the OSRS coordinates to the parent.
 */
export function AdminMap({ value, onCoordSelect, ...mapProps }: AdminMapProps) {
  const [selected, setSelected] = useState<OsrsCoord | null>(value ?? null);

  const handleClick = (coord: OsrsCoord) => {
    setSelected(coord);
    onCoordSelect(coord);
  };

  return (
    <OsrsMap {...mapProps} onClick={handleClick}>
      <AdminOverlay selected={selected} />
      <CoordDisplay coord={selected} />
      <OsrsControls />
    </OsrsMap>
  );
}
