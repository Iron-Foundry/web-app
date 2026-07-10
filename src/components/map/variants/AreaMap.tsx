import { OsrsMap } from "../core/OsrsMap";
import { OsrsControls } from "../ui/OsrsControls";
import { useMapContext } from "../core/MapContext";
import type { OsrsMapBaseProps, OsrsArea } from "../core/types";

interface AreaLayerProps {
  areas: OsrsArea[];
}

function AreaLayer({ areas }: AreaLayerProps) {
  const { osrsToScreen, width, height } = useMapContext();

  if (width === 0 || height === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {areas.map((area, i) => {
        if (area.coords.length < 2) return null;
        const points = area.coords
          .map((c) => {
            const { x, y } = osrsToScreen(c);
            return `${x},${y}`;
          })
          .join(" ");

        const fill = area.fillColor ?? "hsl(42 80% 55% / 0.15)";
        const stroke = area.strokeColor ?? "hsl(42 80% 55% / 0.7)";

        return (
          <polygon
            key={i}
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
}

export interface AreaMapProps extends OsrsMapBaseProps {
  areas: OsrsArea[];
}

/**
 * OSRS map with polygon area highlights.
 * Use for clan territory, competition zones, or any bounded region.
 */
export function AreaMap({ areas, ...mapProps }: AreaMapProps) {
  return (
    <OsrsMap {...mapProps}>
      <AreaLayer areas={areas} />
      <OsrsControls />
    </OsrsMap>
  );
}
