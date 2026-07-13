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
import { RequirementSummary } from "./RequirementSummary";

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

          {tile.requirement && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Requirement
                </p>
                <RequirementSummary node={tile.requirement} />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
