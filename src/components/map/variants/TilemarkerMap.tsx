import { useState } from "react";
import { OsrsMap } from "../core/OsrsMap";
import { OsrsControls } from "../ui/OsrsControls";
import { OsrsPopup } from "../ui/OsrsPopup";
import { useMapContext } from "../core/MapContext";
import type { OsrsMapBaseProps, OsrsTilemarker } from "../core/types";

interface TilemarkerLayerProps {
  markers: OsrsTilemarker[];
}

function TilemarkerLayer({ markers }: TilemarkerLayerProps) {
  const { osrsToScreen, scale } = useMapContext();
  const [active, setActive] = useState<number | null>(null);

  const dotSize = Math.max(6, Math.min(20, scale * 2));

  return (
    <>
      {markers.map((m, i) => {
        const { x, y } = osrsToScreen(m.coord);
        const isActive = active === i;
        const hasPopup = m.label || m.description;
        return (
          <div key={i}>
            <button
              className="absolute pointer-events-auto rounded-full border-2 transition-colors"
              style={{
                left: x - dotSize / 2,
                top: y - dotSize / 2,
                width: dotSize,
                height: dotSize,
                borderColor: m.color ?? "var(--color-primary)",
                backgroundColor: m.color
                  ? `color-mix(in srgb, ${m.color} 60%, transparent)`
                  : "var(--color-primary)",
                opacity: 0.85,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (hasPopup) setActive(isActive ? null : i);
              }}
              aria-label={m.label ?? `tile ${m.coord.x},${m.coord.y}`}
            />
            {isActive && hasPopup && (
              <OsrsPopup
                coord={m.coord}
                label={m.label ?? `${m.coord.x}, ${m.coord.y}`}
                description={m.description}
                onClose={() => setActive(null)}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export interface TilemarkerMapProps extends OsrsMapBaseProps {
  markers: OsrsTilemarker[];
}

/**
 * Read-only OSRS map displaying tilemarkers as interactive dots with popups.
 * Designed for embedding in resources, guides, and content pages.
 */
export function TilemarkerMap({ markers, ...mapProps }: TilemarkerMapProps) {
  return (
    <OsrsMap {...mapProps}>
      <TilemarkerLayer markers={markers} />
      <OsrsControls />
    </OsrsMap>
  );
}
