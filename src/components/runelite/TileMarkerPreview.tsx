import { TileMarkerConfigMap } from "@/components/map/variants/TileMarkerConfigMap";
import type { RuneLiteConfig, TileMarkerData } from "@/types/runeliteConfig";

export function TileMarkerPreview({ config }: { config: RuneLiteConfig }) {
  return (
    <TileMarkerConfigMap
      className="h-full w-full rounded-md border border-border"
      markers={config.data as TileMarkerData[]}
    />
  );
}
