import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runeliteConfigsApi } from "@/api/runeliteConfigs";
import { shineHandlers } from "@/hooks/useShineEffect";
import { BossHealthDisplay } from "./BossHealthDisplay";
import type { BossHealthData } from "@/types/runeliteConfig";

const outer = "shine-border my-4 block w-full max-w-sm rounded-xl";
const card = "w-full space-y-2 rounded-[0.65rem] border border-border bg-card p-2.5";

/**
 * Fetches a stored boss health config by its stable ID and renders its indicators.
 * Downstream guides reference the config by ID so edits never break the embed.
 */
export function BossHealthEmbed({ configId }: { configId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["runelite-config", configId],
    queryFn: () => runeliteConfigsApi.get(configId),
  });
  const [copied, setCopied] = useState(false);

  function copyConfig(): void {
    if (!data) return;
    void navigator.clipboard.writeText(JSON.stringify(data.data));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isLoading) {
    return (
      <div className={outer}>
        <div className={`${card} text-sm text-muted-foreground`}>Loading boss health...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={outer}>
        <div className={`${card} border-destructive/40 bg-destructive/10 text-sm text-destructive`}>
          Could not load boss health config.
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
        <div className="max-h-80 overflow-y-auto rounded-md border border-border p-2">
          <BossHealthDisplay bosses={data.data as BossHealthData[]} />
        </div>
        <Button size="sm" variant="secondary" className="h-7 w-full px-2 text-xs" onClick={copyConfig}>
          {copied ? (
            <Check className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Copy className="mr-1 h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : `Copy ${data.data.length} bosses`}
        </Button>
      </figure>
    </div>
  );
}
