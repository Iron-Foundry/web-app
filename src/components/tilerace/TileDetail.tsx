import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { RepositoryTile } from "@/types/tilerace";
import { getEffectiveTileIcon } from "@/lib/tilerace";

interface TileDetailProps {
  tile: RepositoryTile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TileDetail({ tile, open, onOpenChange }: TileDetailProps): JSX.Element {
  const iconUrl = getEffectiveTileIcon(tile);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-lg bg-muted overflow-hidden">
              {iconUrl ? (
                <img src={iconUrl} alt={tile.title} className="h-11 w-11 object-contain" />
              ) : (
                <div className="h-12 w-12 bg-muted-foreground/20 rounded-lg" />
              )}
            </div>
            <DialogTitle className="text-lg leading-tight">{tile.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {tile.description && (
            <p className="text-sm text-muted-foreground">{tile.description}</p>
          )}

          {tile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tile.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {tile.items.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Required Items
                </p>
                <ul className="space-y-2">
                  {tile.items.map((item) => (
                    <li key={item.item_id} className="flex items-center gap-2">
                      <img
                        src={item.icon_url}
                        alt={item.name}
                        className="h-7 w-7 object-contain"
                      />
                      <span className="text-sm">{item.name}</span>
                      {item.quantity > 1 && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          x{item.quantity}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
