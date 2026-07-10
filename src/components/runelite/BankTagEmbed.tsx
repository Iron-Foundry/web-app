import { useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runeliteConfigsApi } from "@/api/runeliteConfigs";
import { shineHandlers } from "@/hooks/useShineEffect";
import { BankTagDisplay } from "./BankTagDisplay";
import { parseBankTag } from "./bankTag";

const outer = "shine-border my-4 block w-full max-w-sm rounded-xl";
const card = "w-full space-y-2 rounded-[0.65rem] border border-border bg-card p-2.5";

/**
 * Fetches a stored bank tag layout by its stable ID and renders the item grid.
 * Downstream guides reference the config by ID so edits never break the embed.
 */
export function BankTagEmbed({ configId, glow }: { configId: string; glow?: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["runelite-config", configId],
    queryFn: () => runeliteConfigsApi.get(configId),
  });
  const [copied, setCopied] = useState(false);

  const raw = data ? ((data.data[0] as string) ?? "") : "";
  const itemCount = parseBankTag(raw)?.slots.length ?? 0;
  const glowStyle = glow ? ({ "--item-glow": glow } as CSSProperties) : undefined;

  function copyLayout(): void {
    if (!raw) return;
    void navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isLoading) {
    return (
      <div className={outer}>
        <div className={`${card} text-sm text-muted-foreground`}>Loading bank tag...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={outer}>
        <div className={`${card} border-destructive/40 bg-destructive/10 text-sm text-destructive`}>
          Could not load bank tag layout.
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
        <div className="max-h-96 overflow-y-auto" style={glowStyle}>
          <BankTagDisplay raw={raw} />
        </div>
        <Button size="sm" variant="secondary" className="h-7 w-full px-2 text-xs" onClick={copyLayout}>
          {copied ? (
            <Check className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Copy className="mr-1 h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : `Copy ${itemCount} items`}
        </Button>
      </figure>
    </div>
  );
}
