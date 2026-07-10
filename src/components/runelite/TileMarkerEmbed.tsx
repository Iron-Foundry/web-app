import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runeliteConfigsApi } from "@/api/runeliteConfigs";
import { TileMarkerConfigMap } from "@/components/map/variants/TileMarkerConfigMap";
import { shineHandlers } from "@/hooks/useShineEffect";
import type { TileMarkerData } from "@/types/runeliteConfig";

interface TileMarkerEmbedProps {
  configId: string;
  embedded?: boolean;
}

const outerBase = "shine-border block w-full rounded-xl";
const card = "w-full space-y-2 rounded-[0.65rem] border border-border bg-card p-2.5";
const square = "relative aspect-square w-full overflow-hidden rounded-md border border-border";

/**
 * Fetches a stored tile marker config by its stable ID and renders it on an OSRS map.
 * Downstream guides and pages reference the config by ID so edits never break the embed.
 */
export function TileMarkerEmbed({ configId, embedded = false }: TileMarkerEmbedProps) {
  const outer = embedded ? outerBase : `mx-auto my-4 max-w-72 ${outerBase}`;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["runelite-config", configId],
    queryFn: () => runeliteConfigsApi.get(configId),
  });
  const [copied, setCopied] = useState(false);

  function copyTiles(): void {
    if (!data) return;
    void navigator.clipboard.writeText(JSON.stringify(data.data));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isLoading) {
    return (
      <div className={outer}>
        <div className={card}>
          <div className={`${square} flex items-center justify-center bg-muted/30 text-sm text-muted-foreground`}>
            Loading map...
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={outer}>
        <div className={card}>
          <div className={`${square} flex items-center justify-center border-destructive/40 bg-destructive/10 text-sm text-destructive`}>
            Could not load tile marker map.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={outer} {...shineHandlers}>
      <figure className={card}>
        <figcaption className="flex h-9 flex-col justify-start overflow-hidden">
          <p className="truncate font-rs-bold text-sm text-primary leading-tight">{data.name}</p>
          {data.description && (
            <p className="truncate text-xs text-muted-foreground">{data.description}</p>
          )}
        </figcaption>
        <div className={square}>
          <TileMarkerConfigMap className="h-full w-full" markers={data.data as TileMarkerData[]} />
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 w-full px-2 text-xs"
          onClick={copyTiles}
        >
          {copied ? (
            <Check className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Copy className="mr-1 h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : `Copy ${data.data.length} tiles`}
        </Button>
      </figure>
    </div>
  );
}
