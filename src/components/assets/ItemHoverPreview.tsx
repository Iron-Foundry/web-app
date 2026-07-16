import { API_URL } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverPreviewLayer } from "@/components/assets/HoverPreviewLayer";
import type { OsrsItem } from "@/types/osrsCache";

const PREVIEW_WIDTH = 260;
const PREVIEW_HEIGHT = 300;

interface ItemHoverPreviewProps {
  item: OsrsItem;
}

export function ItemHoverPreview({ item }: ItemHoverPreviewProps): React.JSX.Element {
  return (
    <HoverPreviewLayer width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT}>
      <Card className="w-65 shadow-xl overflow-hidden">
        <div className="flex items-center justify-center h-44 bg-muted/60">
          {item.icon_url && (
            <img
              src={`${API_URL}/osrs-cache${item.icon_url}`}
              alt={item.name}
              decoding="async"
              style={{ imageRendering: "pixelated", width: 144, height: 144 }}
            />
          )}
        </div>
        <CardContent className="p-3 space-y-1.5">
          <p className="text-sm font-medium text-foreground break-all leading-snug">
            {item.name}
          </p>
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
            {item.examine}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              #{item.item_id}
            </Badge>
            {item.members && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Members
              </Badge>
            )}
            {item.value > 0 && (
              <span className="text-xs text-muted-foreground">{item.value.toLocaleString()} gp</span>
            )}
          </div>
        </CardContent>
      </Card>
    </HoverPreviewLayer>
  );
}
