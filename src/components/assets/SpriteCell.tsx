import { memo } from "react";
import { API_URL } from "@/context/AuthContext";
import { Check, Copy, Download, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OsrsSprite } from "@/types/osrsCache";

const OVERLAY_BUTTON =
  "absolute p-0.5 rounded bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity";

export interface SpriteCellProps {
  sprite: OsrsSprite;
  left: number;
  width: number;
  translateY: number;
  copied: boolean;
  onCopy: (sprite: OsrsSprite) => void;
  onDownload: (sprite: OsrsSprite) => void;
  onOpenRender: (sprite: OsrsSprite) => void;
  onHoverStart: (sprite: OsrsSprite) => void;
  onHoverEnd: () => void;
}

function SpriteCellImpl({
  sprite,
  left,
  width,
  translateY,
  copied,
  onCopy,
  onDownload,
  onOpenRender,
  onHoverStart,
  onHoverEnd,
}: SpriteCellProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "group absolute top-0 rounded-md border border-border bg-muted/30 overflow-hidden cursor-pointer",
        "hover:border-primary hover:bg-muted transition-colors flex flex-col items-center justify-center h-20 p-2",
      )}
      style={{ left, width, transform: `translateY(${translateY}px)` }}
      onClick={() => onCopy(sprite)}
      onMouseEnter={() => onHoverStart(sprite)}
      onMouseLeave={onHoverEnd}
    >
      <img
        src={`${API_URL}/osrs-cache${sprite.png_url}`}
        alt={sprite.name ?? `Sprite ${sprite.sprite_id}`}
        loading="lazy"
        decoding="async"
        className="max-h-10 max-w-full object-contain"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
        {sprite.name ?? `#${sprite.sprite_id}`}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload(sprite);
        }}
        className={cn(OVERLAY_BUTTON, "top-1 left-1 hover:text-foreground")}
        title="Download PNG"
      >
        <Download className="h-3 w-3" />
      </button>
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? (
          <Check className="h-3 w-3 text-green-400" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenRender(sprite);
        }}
        className={cn(OVERLAY_BUTTON, "bottom-1 left-1 hover:text-foreground")}
        title="Render at custom scale"
      >
        <Maximize2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export const SpriteCell = memo(SpriteCellImpl);
