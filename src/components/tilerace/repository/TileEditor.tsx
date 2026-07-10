import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { ItemSearch } from "./ItemSearch";
import { useCreateTile, useUpdateTile } from "@/hooks/useTilerace";
import { TILE_TAGS } from "@/lib/tilerace";
import type { RepositoryTile, TileItem, TileTag } from "@/types/tilerace";

interface TileEditorProps {
  tile?: RepositoryTile;
  onDone: () => void;
}

export function TileEditor({ tile, onDone }: TileEditorProps): JSX.Element {
  const [title, setTitle] = useState(tile?.title ?? "");
  const [description, setDescription] = useState(tile?.description ?? "");
  const [iconUrl, setIconUrl] = useState(tile?.icon_url ?? "");
  const [items, setItems] = useState<TileItem[]>(tile?.items ?? []);
  const [tags, setTags] = useState<TileTag[]>(tile?.tags ?? []);

  const { mutate: create, isPending: creating } = useCreateTile();
  const { mutate: update, isPending: updating } = useUpdateTile();

  const isLoading = creating || updating;

  function addItem(osrsItem: { id: number; name: string; icon_url: string }) {
    if (items.some((i) => i.item_id === osrsItem.id)) return;
    setItems((prev) => [
      ...prev,
      { item_id: osrsItem.id, name: osrsItem.name, quantity: 1, icon_url: osrsItem.icon_url },
    ]);
  }

  function removeItem(itemId: number) {
    setItems((prev) => prev.filter((i) => i.item_id !== itemId));
  }

  function updateQuantity(itemId: number, qty: number) {
    setItems((prev) =>
      prev.map((i) => (i.item_id === itemId ? { ...i, quantity: Math.max(1, qty) } : i)),
    );
  }

  function toggleTag(tag: TileTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function handleSubmit() {
    const data = {
      title,
      description,
      icon_url: iconUrl || null,
      icon_source: "wiki" as const,
      items,
      tags,
    };
    if (tile) {
      update({ id: tile.id, data }, { onSuccess: onDone });
    } else {
      create(data, { onSuccess: onDone });
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tile title" />
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this tile require?"
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Icon URL override</Label>
        <Input
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          placeholder="Leave blank to use first item icon"
        />
      </div>

      <div className="space-y-2">
        <Label>Items</Label>
        <ItemSearch onSelect={addItem} />
        {items.length > 0 && (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.item_id} className="flex items-center gap-2">
                <img src={item.icon_url} alt={item.name} className="h-6 w-6 object-contain" />
                <span className="flex-1 text-sm">{item.name}</span>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.item_id, Number(e.target.value))}
                  className="h-7 w-16 text-xs text-center"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeItem(item.item_id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {TILE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                tags.includes(tag)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSubmit} disabled={isLoading || !title.trim()}>
          {tile ? "Save" : "Create"}
        </Button>
        <Button size="sm" variant="outline" onClick={onDone} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
