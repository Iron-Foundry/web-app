import { memo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { API_URL } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { OsrsItem } from "@/types/osrsCache";

interface ItemVariantRowProps {
  variant: OsrsItem;
  active: boolean;
  onSelect: (variant: OsrsItem) => void;
  onHoverStart: (variant: OsrsItem) => void;
  onHoverEnd: () => void;
}

function ItemVariantRowImpl({
  variant,
  active,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: ItemVariantRowProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!variant.icon_url) return;
    await navigator.clipboard.writeText(`${API_URL}/osrs-cache${variant.icon_url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(variant)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(variant);
      }}
      onMouseEnter={() => onHoverStart(variant)}
      onMouseLeave={onHoverEnd}
      className={cn(
        "group/variant w-full flex items-center gap-2 text-left text-xs px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer",
        active && "bg-muted text-primary",
      )}
    >
      <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded bg-muted/30 border border-border overflow-hidden">
        {variant.icon_url ? (
          <img
            src={`${API_URL}/osrs-cache${variant.icon_url}`}
            alt={variant.name}
            loading="lazy"
            decoding="async"
            className="max-h-7 max-w-full object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        ) : null}
      </div>
      <span className="truncate flex-1">
        {variant.name}
        <span className="text-muted-foreground ml-1">#{variant.item_id}</span>
      </span>
      {variant.icon_url && (
        <button
          onClick={handleCopy}
          className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover/variant:opacity-100 transition-opacity"
          title="Copy icon URL"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

export const ItemVariantRow = memo(ItemVariantRowImpl);
