import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { RepositoryTile } from "@/types/tilerace";
import { getEffectiveTileIcon } from "@/lib/tilerace";
import { TileDetail } from "./TileDetail";

interface TileCardProps {
  tile: RepositoryTile;
  compact?: boolean;
  selectable?: boolean;
  onSelect?: (tile: RepositoryTile) => void;
}

export function TileCard({ tile, compact = false, selectable = false, onSelect }: TileCardProps): JSX.Element {
  const [detailOpen, setDetailOpen] = useState(false);
  const iconUrl = getEffectiveTileIcon(tile);

  function handleClick() {
    if (selectable && onSelect) {
      onSelect(tile);
    } else {
      setDetailOpen(true);
    }
  }

  if (compact) {
    return (
      <>
        <button
          onClick={handleClick}
          className="flex items-center gap-2 w-full rounded-md p-2 text-left hover:bg-muted transition-colors"
        >
          <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded bg-muted overflow-hidden">
            {iconUrl ? (
              <img src={iconUrl} alt={tile.title} className="h-7 w-7 object-contain" />
            ) : (
              <div className="h-8 w-8 bg-muted-foreground/20 rounded" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{tile.title}</p>
            <p className="text-xs text-muted-foreground truncate">{tile.items.length} item{tile.items.length !== 1 ? "s" : ""}</p>
          </div>
        </button>
        {!selectable && (
          <TileDetail tile={tile} open={detailOpen} onOpenChange={setDetailOpen} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex flex-col gap-2 rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors w-full"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-md bg-muted overflow-hidden">
            {iconUrl ? (
              <img src={iconUrl} alt={tile.title} className="h-9 w-9 object-contain" />
            ) : (
              <div className="h-10 w-10 bg-muted-foreground/20 rounded-md" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm leading-tight truncate">{tile.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{tile.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {tile.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      </button>
      {!selectable && (
        <TileDetail tile={tile} open={detailOpen} onOpenChange={setDetailOpen} />
      )}
    </>
  );
}
