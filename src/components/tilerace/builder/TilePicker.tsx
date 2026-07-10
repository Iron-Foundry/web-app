import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { TileCard } from "@/components/tilerace/TileCard";
import { useTiles } from "@/hooks/useTilerace";
import { TILE_TAGS } from "@/lib/tilerace";
import type { RepositoryTile, TileTag } from "@/types/tilerace";

interface TilePickerProps {
  selectedPathPosition: number | null;
  currentTileId: string | null | undefined;
  onAssign: (tileId: string | null) => void;
}

export function TilePicker({
  selectedPathPosition,
  currentTileId,
  onAssign,
}: TilePickerProps): JSX.Element {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<TileTag | undefined>();
  const { data: tiles = [] } = useTiles(
    tagFilter || search ? { tag: tagFilter, search: search || undefined } : undefined,
  );

  if (selectedPathPosition === null) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border rounded-lg">
        Click a path cell to assign a tile
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Assign to step {selectedPathPosition}</p>
        {currentTileId && (
          <Button size="sm" variant="ghost" onClick={() => onAssign(null)} className="gap-1 text-xs h-7">
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tiles..."
        className="h-8 text-sm"
      />

      <div className="flex flex-wrap gap-1">
        {TILE_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setTagFilter(tagFilter === tag ? undefined : tag)}
            className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
              tagFilter === tag
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className={tile.id === currentTileId ? "ring-1 ring-primary rounded-md" : ""}
          >
            <TileCard
              tile={tile}
              compact
              selectable
              onSelect={(t) => onAssign(t.id)}
            />
          </div>
        ))}
        {tiles.length === 0 && (
          <p className="text-xs text-muted-foreground py-4 text-center">No tiles found.</p>
        )}
      </div>
    </div>
  );
}
