import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { TileCard } from "@/components/tilerace/TileCard";
import { TileEditor } from "./TileEditor";
import { useTiles, useDeleteTile } from "@/hooks/useTilerace";
import { TILE_TAGS } from "@/lib/tilerace";
import type { RepositoryTile, TileTag } from "@/types/tilerace";

export function RepositoryList(): JSX.Element {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<TileTag | undefined>();
  const [editing, setEditing] = useState<RepositoryTile | null | "new">(null);

  const { data: tiles = [], isLoading } = useTiles(
    tagFilter || search ? { tag: tagFilter, search: search || undefined } : undefined,
  );
  const { mutate: deleteTile } = useDeleteTile();

  if (editing !== null) {
    return (
      <TileEditor
        tile={editing === "new" ? undefined : editing}
        onDone={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tiles..."
          className="h-8 text-sm max-w-64"
        />
        <Button size="sm" onClick={() => setEditing("new")} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Tile
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setTagFilter(undefined)}
          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
            !tagFilter
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-foreground/40"
          }`}
        >
          All
        </button>
        {TILE_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setTagFilter(tagFilter === tag ? undefined : tag)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              tagFilter === tag
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && tiles.length === 0 && (
        <p className="text-sm text-muted-foreground">No tiles found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <div key={tile.id} className="relative group">
            <TileCard tile={tile} />
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="h-6 w-6"
                onClick={() => setEditing(tile)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                className="h-6 w-6"
                onClick={() => {
                  if (confirm(`Delete "${tile.title}"?`)) deleteTile(tile.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
