import { useState } from "react";
import { Loader2 } from "lucide-react";
import { SPRITE_SCALES, downloadImage, spriteImageUrl, type SpriteScale } from "@/api/osrsAssets";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OsrsSprite } from "@/types/osrsAssets";

interface SpriteRenderDialogProps {
  sprite: OsrsSprite;
  onClose: () => void;
}

function scaleLabel(sprite: OsrsSprite, scale: SpriteScale): string {
  if (scale === "max") return "Largest";
  const n = Number(scale);
  return `${scale}x (${sprite.width * n} x ${sprite.height * n})`;
}

export function SpriteRenderDialog({ sprite, onClose }: SpriteRenderDialogProps): React.JSX.Element {
  const [scale, setScale] = useState<SpriteScale>("1");
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(false);

  async function handleRender() {
    setRendering(true);
    setError(false);
    try {
      const url = spriteImageUrl(sprite.sprite_id, sprite.frame_index, scale);
      await downloadImage(url, `${sprite.name}_${scale}x.webp`);
      onClose();
    } catch {
      setError(true);
    } finally {
      setRendering(false);
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && !rendering && onClose()}>
      <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-rs-bold">Download {sprite.name}</DialogTitle>
        </DialogHeader>

        <Select value={scale} onValueChange={(v) => setScale(v as SpriteScale)} disabled={rendering}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPRITE_SCALES.map((s) => (
              <SelectItem key={s} value={s}>
                {scaleLabel(sprite, s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && <p className="text-xs text-destructive">OSRSClans did not send the image.</p>}

        <DialogFooter>
          <Button onClick={handleRender} disabled={rendering}>
            {rendering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              "Download"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
