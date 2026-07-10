import { useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runeliteConfigsApi } from "@/api/runeliteConfigs";
import { shineHandlers } from "@/hooks/useShineEffect";
import { InventorySetupDisplay } from "./InventorySetupDisplay";
import type { InventorySetup } from "@/types/runeliteConfig";

const outer = "shine-border my-4 block w-full max-w-md rounded-xl";
const card = "w-full space-y-2 rounded-[0.65rem] border border-border bg-card p-2.5";

/**
 * Fetches a stored inventory setup by its stable ID and renders its gear, inventory and notes.
 * Downstream guides reference the config by ID so edits never break the embed.
 */
export function InventorySetupEmbed({ configId, glow }: { configId: string; glow?: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["runelite-config", configId],
    queryFn: () => runeliteConfigsApi.get(configId),
  });
  const [copied, setCopied] = useState(false);

  const setup = data ? (data.data[0] as InventorySetup | undefined) : undefined;
  const glowStyle = glow ? ({ "--item-glow": glow } as CSSProperties) : undefined;

  function copySetup(): void {
    if (!setup) return;
    void navigator.clipboard.writeText(JSON.stringify(setup));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isLoading) {
    return (
      <div className={outer}>
        <div className={`${card} text-sm text-muted-foreground`}>Loading setup...</div>
      </div>
    );
  }

  if (isError || !data || !setup) {
    return (
      <div className={outer}>
        <div className={`${card} border-destructive/40 bg-destructive/10 text-sm text-destructive`}>
          Could not load inventory setup.
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
        <div style={glowStyle}>
          <InventorySetupDisplay setup={setup} />
        </div>
        <Button size="sm" variant="secondary" className="h-7 w-full px-2 text-xs" onClick={copySetup}>
          {copied ? (
            <Check className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Copy className="mr-1 h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy setup"}
        </Button>
      </figure>
    </div>
  );
}
