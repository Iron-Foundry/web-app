import { memo } from "react";
import { API_URL } from "@/context/AuthContext";
import { Check, Copy, Download, Layers, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OsrsItem } from "@/types/osrsCache";

export interface ItemIconCellProps {
  item: OsrsItem;
  left: number;
  width: number;
  translateY: number;
  copied: boolean;
  onCopy: (item: OsrsItem) => void;
  onDownload: (item: OsrsItem) => void;
  onOpenRender: (item: OsrsItem) => void;
  onOpenVariants: (item: OsrsItem, left: number, translateY: number, width: number) => void;
  onHoverStart: (item: OsrsItem) => void;
  onHoverEnd: () => void;
}

const OVERLAY_BUTTON =
  "absolute p-0.5 rounded bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity";

function ItemIconCellImpl({
  item,
  left,
  width,
  translateY,
  copied,
  onCopy,
  onDownload,
  onOpenRender,
  onOpenVariants,
  onHoverStart,
  onHoverEnd,
}: ItemIconCellProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "group absolute top-0 rounded-md border border-border bg-muted/30 overflow-hidden cursor-pointer",
        "hover:border-primary hover:bg-muted transition-colors flex flex-col items-center justify-center h-20 p-2",
      )}
      style={{ left, width, transform: `translateY(${translateY}px)` }}
      onClick={() => onCopy(item)}
      onMouseEnter={() => onHoverStart(item)}
      onMouseLeave={onHoverEnd}
    >
      {item.icon_url ? (
        <img
          src={`${API_URL}/osrs-cache${item.icon_url}`}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="max-h-10 max-w-full object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      ) : (
        <div className="h-10 w-10 flex items-center justify-center">
          <span className="font-rs-bold text-[9px] leading-tight text-muted-foreground/50 text-center">
            No Icon
          </span>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
        {item.name}
      </p>

      {item.icon_url && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(item);
          }}
          className={cn(OVERLAY_BUTTON, "top-1 left-1 hover:text-foreground")}
          title="Download PNG"
        >
          <Download className="h-3 w-3" />
        </button>
      )}

      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? (
          <Check className="h-3 w-3 text-green-400" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground" />
        )}
      </div>

      {item.icon_url && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenRender(item);
          }}
          className={cn(OVERLAY_BUTTON, "bottom-1 left-1 hover:text-foreground")}
          title="Render at custom size"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      )}

      {item.variant_count > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenVariants(item, left, translateY, width);
          }}
          className={cn(OVERLAY_BUTTON, "bottom-1 right-1 hover:text-primary")}
          title="Show variants"
        >
          <Layers className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export const ItemIconCell = memo(ItemIconCellImpl);
