import { API_URL } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverPreviewLayer } from "@/components/assets/HoverPreviewLayer";
import type { OsrsSprite } from "@/types/osrsCache";

const PREVIEW_WIDTH = 260;
const PREVIEW_HEIGHT = 280;

interface SpriteHoverPreviewProps {
  sprite: OsrsSprite;
}

export function SpriteHoverPreview({ sprite }: SpriteHoverPreviewProps): React.JSX.Element {
  const scale = Math.max(1, Math.min(8, Math.floor(160 / Math.max(sprite.width, sprite.height))));

  return (
    <HoverPreviewLayer width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT}>
      <Card className="w-65 shadow-xl overflow-hidden">
        <div className="flex items-center justify-center h-44 bg-muted/60">
          <img
            src={`${API_URL}/osrs-cache${sprite.png_url}`}
            alt={sprite.name ?? `Sprite ${sprite.sprite_id}`}
            decoding="async"
            style={{
              imageRendering: "pixelated",
              width: sprite.width * scale,
              height: sprite.height * scale,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          />
        </div>
        <CardContent className="p-3 space-y-1.5">
          <p className="text-sm font-medium text-foreground break-all leading-snug">
            {sprite.name ?? `Sprite #${sprite.sprite_id}`}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              #{sprite.sprite_id}
            </Badge>
            {sprite.category && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {sprite.category}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {sprite.width}x{sprite.height}
            </span>
          </div>
        </CardContent>
      </Card>
    </HoverPreviewLayer>
  );
}
