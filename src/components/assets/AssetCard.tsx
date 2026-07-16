import { memo } from "react";
import { API_URL } from "@/context/AuthContext";
import { Check, Copy, Download, Film, ImageIcon, Trash2 } from "lucide-react";
import { assetThumbnailUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/components/assets/format";
import type { Asset } from "@/types/assets";

interface AssetCardProps {
  asset: Asset;
  copied: boolean;
  canDelete: boolean;
  onCopy: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onHoverStart: (asset: Asset) => void;
  onHoverEnd: () => void;
}

function AssetCardImpl({
  asset,
  copied,
  canDelete,
  onCopy,
  onDelete,
  onHoverStart,
  onHoverEnd,
}: AssetCardProps): React.JSX.Element {
  const isImage = asset.content_type.startsWith("image/");
  const isVideo = asset.content_type.startsWith("video/");

  return (
    <div
      className={cn(
        "group relative rounded-md border border-border bg-muted/30 overflow-hidden cursor-pointer",
        "hover:border-primary hover:bg-muted transition-colors",
      )}
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 140px" }}
      onMouseEnter={() => onHoverStart(asset)}
      onMouseLeave={onHoverEnd}
      onClick={() => onCopy(asset)}
    >
      <div className="flex items-center justify-center h-24 bg-muted/50">
        {isImage ? (
          <img
            src={assetThumbnailUrl(asset.url, asset.content_type, 256)}
            alt={asset.original_name}
            loading="lazy"
            decoding="async"
            className="max-h-24 max-w-full object-contain"
          />
        ) : isVideo ? (
          <Film className="h-8 w-8 text-muted-foreground/40" />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
        )}
      </div>

      <div className="px-2 py-1.5">
        <p className="text-xs font-medium truncate text-foreground">{asset.original_name}</p>
        <p className="text-[10px] text-muted-foreground">{formatBytes(asset.size_bytes)}</p>
      </div>

      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? (
          <span className="inline-flex items-center gap-0.5 rounded bg-green-500/90 px-1.5 py-0.5 text-[10px] text-white">
            <Check className="h-2.5 w-2.5" /> Copied
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            <Copy className="h-2.5 w-2.5" /> Copy URL
          </span>
        )}
      </div>

      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`${API_URL}${asset.url}`}
          download={asset.original_name}
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 rounded bg-background/80 text-muted-foreground hover:text-foreground"
          title="Download"
        >
          <Download className="h-3 w-3" />
        </a>
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(asset);
            }}
            className="p-0.5 rounded bg-background/80 text-muted-foreground hover:text-destructive"
            title="Delete asset"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export const AssetCard = memo(AssetCardImpl);
