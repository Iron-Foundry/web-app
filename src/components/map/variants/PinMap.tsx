import { useState } from "react";
import { MapPin } from "lucide-react";
import { OsrsMap } from "../core/OsrsMap";
import { OsrsControls } from "../ui/OsrsControls";
import { OsrsPopup } from "../ui/OsrsPopup";
import { useMapContext } from "../core/MapContext";
import type { OsrsMapBaseProps, OsrsPin } from "../core/types";

interface PinLayerProps {
  pins: OsrsPin[];
}

function PinLayer({ pins }: PinLayerProps) {
  const { osrsToScreen } = useMapContext();
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      {pins.map((pin, i) => {
        const { x, y } = osrsToScreen(pin.coord);
        const isActive = active === i;
        const color = pin.color ?? "var(--color-primary)";

        return (
          <div key={i}>
            <button
              className="absolute pointer-events-auto -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform"
              style={{ left: x, top: y }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setActive(isActive ? null : i);
              }}
              aria-label={pin.label}
            >
              <MapPin
                className="drop-shadow-md"
                style={{ color, fill: color, fillOpacity: 0.7 }}
                size={24}
              />
            </button>
            {isActive && (
              <OsrsPopup
                coord={pin.coord}
                label={pin.label}
                description={pin.description}
                onClose={() => setActive(null)}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export interface PinMapProps extends OsrsMapBaseProps {
  pins: OsrsPin[];
}

/**
 * OSRS map with named location pins (MapPin icons) and themed popups.
 * Use for boss locations, event meetup spots, or any named coordinate.
 */
export function PinMap({ pins, ...mapProps }: PinMapProps) {
  return (
    <OsrsMap {...mapProps}>
      <PinLayer pins={pins} />
      <OsrsControls />
    </OsrsMap>
  );
}
