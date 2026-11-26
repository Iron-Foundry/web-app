import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ITEM_SCALES, downloadImage, itemImageUrl, type ItemScale } from "@/api/osrsAssets";
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
import type { OsrsItem } from "@/types/osrsAssets";

interface ItemRenderDialogProps {
  item: OsrsItem;
  onClose: () => void;
}

export function ItemRenderDialog({ item, onClose }: ItemRenderDialogProps): React.JSX.Element {
  const [scale, setScale] = useState<ItemScale>("max");
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(false);

  async function handleRender() {
    setRendering(true);
    setError(false);
    try {
      const label = ITEM_SCALES.find((s) => s.scale === scale)?.label.replace(" x ", "x") ?? scale;
      await downloadImage(itemImageUrl(item.item_id, scale), `${item.name}_${label}.webp`);
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
          <DialogTitle className="font-rs-bold">Download {item.name}</DialogTitle>
        </DialogHeader>

        <Select value={scale} onValueChange={(v) => setScale(v as ItemScale)} disabled={rendering}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ITEM_SCALES.map((s) => (
              <SelectItem key={s.scale} value={s.scale}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && (
          <p className="text-xs text-destructive">
            OSRSClans has no image for this item.
          </p>
        )}

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
