import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { TileCard } from "@/components/tilerace/TileCard";
import { useTiles } from "@/hooks/useTilerace";
import { TILE_TAGS } from "@/lib/tilerace";
import type { BoardCell, RepositoryTile, TileTag } from "@/types/tilerace";

interface TilePickerProps {
  selectedPathPosition: number | null;
  currentTileId: string | null | undefined;
  cells: BoardCell[];
  onAssign: (tileId: string | null) => void;
}

type PlacementFilter = "placed" | "unplaced";

function chipClass(active: boolean): string {
  return `text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border text-muted-foreground hover:border-foreground/40"
  }`;
}

function countByTile(cells: BoardCell[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const cell of cells) {
    if (cell.path_position == null || !cell.tile_id) continue;
    counts.set(cell.tile_id, (counts.get(cell.tile_id) ?? 0) + 1);
  }
  return counts;
}

export function TilePicker({
  selectedPathPosition,
  currentTileId,
  cells,
  onAssign,
}: TilePickerProps): JSX.Element {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<TileTag | undefined>();
  const { data: tiles = [] } = useTiles(
    tagFilter || search ? { tag: tagFilter, search: search || undefined } : undefined,
  );
  const [placementFilter, setPlacementFilter] = useState<PlacementFilter | undefined>();
  const placedCounts = useMemo(() => countByTile(cells), [cells]);
  const visibleTiles = useMemo(() => {
    if (!placementFilter) return tiles;
    const wantPlaced = placementFilter === "placed";
    return tiles.filter((tile) => placedCounts.has(tile.id) === wantPlaced);
  }, [tiles, placedCounts, placementFilter]);

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
            className={chipClass(tagFilter === tag)}
          >
            {tag}
          </button>
        ))}
        <span className="mx-0.5 w-px self-stretch bg-border" />
        {(["unplaced", "placed"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() =>
              setPlacementFilter(placementFilter === filter ? undefined : filter)
            }
            className={chipClass(placementFilter === filter)}
          >
            {filter === "placed" ? "Placed" : "Not Placed"}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {visibleTiles.map((tile) => {
          const placed = placedCounts.get(tile.id) ?? 0;
          return (
            <div
              key={tile.id}
              className={tile.id === currentTileId ? "ring-1 ring-primary rounded-md" : ""}
            >
              <TileCard
                tile={tile}
                compact
                selectable
                onSelect={(t) => onAssign(t.id)}
                trailing={
                  placed > 0 ? (
                    <Badge
                      variant="secondary"
                      title={`On the board ${placed} time${placed !== 1 ? "s" : ""}`}
                      className="px-1.5 py-0 text-[10px] tabular-nums"
                    >
                      x{placed}
                    </Badge>
                  ) : null
                }
              />
            </div>
          );
        })}
        {visibleTiles.length === 0 && (
          <p className="text-xs text-muted-foreground py-4 text-center">No tiles found.</p>
        )}
      </div>
    </div>
  );
}
