import { API_URL } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import { HoverPreviewLayer } from "@/components/assets/HoverPreviewLayer";
import { formatBytes, formatDate } from "@/components/assets/format";
import type { Asset } from "@/types/assets";

const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 320;

interface AssetHoverPreviewProps {
  asset: Asset;
}

export function AssetHoverPreview({ asset }: AssetHoverPreviewProps): React.JSX.Element {
  const isImage = asset.content_type.startsWith("image/");
  const isVideo = asset.content_type.startsWith("video/");

  return (
    <HoverPreviewLayer width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT}>
      <Card className="w-70 shadow-xl overflow-hidden">
        <div className="flex items-center justify-center h-44 bg-muted/60">
          {isImage ? (
            <img
              src={`${API_URL}${asset.url}`}
              alt={asset.original_name}
              decoding="async"
              className="max-h-44 max-w-full object-contain"
            />
          ) : isVideo ? (
            <video
              src={`${API_URL}${asset.url}`}
              className="max-h-44 max-w-full object-contain"
              muted
              autoPlay
              loop
              playsInline
            />
          ) : (
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          )}
        </div>
        <CardContent className="p-3 space-y-1.5">
          <p className="text-sm font-medium text-foreground break-all leading-snug">
            {asset.original_name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {asset.content_type}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatBytes(asset.size_bytes)}</span>
          </div>
          {asset.uploaded_by && (
            <p className="text-xs text-muted-foreground">
              by {asset.uploaded_by.rsn ?? asset.uploaded_by.discord_username}
            </p>
          )}
          {asset.created_at && (
            <p className="text-xs text-muted-foreground">{formatDate(asset.created_at)}</p>
          )}
        </CardContent>
      </Card>
    </HoverPreviewLayer>
  );
}
