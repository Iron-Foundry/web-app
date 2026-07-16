import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ITEM_RENDER_SIZES, osrsCacheApi, type ItemRenderSize } from "@/api/osrsCache";
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
import type { OsrsItem } from "@/types/osrsCache";

interface ItemRenderDialogProps {
  item: OsrsItem;
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

export function ItemRenderDialog({ item, onClose }: ItemRenderDialogProps): React.JSX.Element {
  const [size, setSize] = useState<ItemRenderSize>(512);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(false);

  async function handleRender() {
    setRendering(true);
    setError(false);
    try {
      const blob = await osrsCacheApi.renderItemIcon(item.item_id, size);
      downloadBlob(blob, `${item.name}_${size}x${size}.webp`);
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
          <DialogTitle className="font-rs-bold">Render {item.name}</DialogTitle>
        </DialogHeader>

        <Select
          value={String(size)}
          onValueChange={(v) => setSize(Number(v) as ItemRenderSize)}
          disabled={rendering}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ITEM_RENDER_SIZES.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s} x {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && (
          <p className="text-xs text-destructive">
            Render failed. This item may have no visual model.
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
