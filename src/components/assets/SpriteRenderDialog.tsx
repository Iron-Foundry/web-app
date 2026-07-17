import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  SPRITE_RENDER_SCALES,
  osrsCacheApi,
  type SpriteRenderScale,
} from "@/api/osrsCache";
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
import type { OsrsSprite } from "@/types/osrsCache";

interface SpriteRenderDialogProps {
  sprite: OsrsSprite;
  onClose: () => void;
}

function downloadBlob(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

export function SpriteRenderDialog({
  sprite,
  onClose,
}: SpriteRenderDialogProps): React.JSX.Element {
  const [scale, setScale] = useState<SpriteRenderScale>(1);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(false);

  async function handleRender() {
    setRendering(true);
    setError(false);
    try {
      const blob = await osrsCacheApi.renderSprite(
        sprite.sprite_id,
        sprite.frame_index,
        scale,
      );
      const name = sprite.name ?? `sprite_${sprite.sprite_id}`;
      downloadBlob(blob, `${name}_${sprite.width * scale}x${sprite.height * scale}.webp`);
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
          <DialogTitle className="font-rs-bold">
            Render {sprite.name ?? `#${sprite.sprite_id}`}
          </DialogTitle>
        </DialogHeader>

        <Select
          value={String(scale)}
          onValueChange={(v) => setScale(Number(v) as SpriteRenderScale)}
          disabled={rendering}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPRITE_RENDER_SCALES.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}x ({sprite.width * s} x {sprite.height * s})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && (
          <p className="text-xs text-destructive">
            Render failed. Try a smaller scale.
          </p>
        )}

        <DialogFooter>
          <Button onClick={handleRender} disabled={rendering}>
            {rendering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rendering...
              </>
            ) : (
              "Render and download"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
