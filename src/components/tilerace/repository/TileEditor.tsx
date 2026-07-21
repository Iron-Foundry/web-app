import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RequirementBuilder } from "./RequirementBuilder";
import { AssetPickerDialog } from "@/components/assets/AssetPickerDialog";
import { useCreateTile, useUpdateTile } from "@/hooks/useTilerace";
import { TILE_TAGS, collectRequirementItems } from "@/lib/tilerace";
import type { RepositoryTile, RequirementNode, TileItem, TileTag } from "@/types/tilerace";

interface TileEditorProps {
  tile?: RepositoryTile;
  onDone: () => void;
}

function initialRequirement(tile?: RepositoryTile): RequirementNode {
  if (tile?.requirement) return tile.requirement;
  const leaves: RequirementNode[] = (tile?.items ?? []).map((i: TileItem) => ({
    kind: "item",
    item_id: i.item_id,
    name: i.name,
    quantity: i.quantity,
    icon_url: i.icon_url,
  }));
  return { kind: "and", children: leaves };
}

export function TileEditor({ tile, onDone }: TileEditorProps): JSX.Element {
  const [title, setTitle] = useState(tile?.title ?? "");
  const [description, setDescription] = useState(tile?.description ?? "");
  const [iconUrl, setIconUrl] = useState(tile?.icon_url ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [requirement, setRequirement] = useState<RequirementNode>(
    initialRequirement(tile),
  );
  const [tags, setTags] = useState<TileTag[]>(tile?.tags ?? []);

  const { mutate: create, isPending: creating } = useCreateTile();
  const { mutate: update, isPending: updating } = useUpdateTile();

  const isLoading = creating || updating;

  function toggleTag(tag: TileTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function handleSubmit() {
    const items = collectRequirementItems(requirement);
    const data = {
      title,
      description,
      icon_url: iconUrl || null,
      icon_source: "wiki" as const,
      items,
      requirement,
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
        <div className="flex gap-1.5">
          <Input
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="Leave blank to use first item icon"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0"
            onClick={() => setPickerOpen(true)}
            title="Choose icon from items, sprites, or uploaded assets"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AssetPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={setIconUrl}
      />

      <div className="space-y-2">
        <Label>Requirement</Label>
        <RequirementBuilder node={requirement} onChange={setRequirement} />
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
