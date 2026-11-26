import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FrenzyCardImage } from "../FrenzySourceCard";
import { CardImagePicker } from "./CardImagePicker";
import { CardNameField } from "./CardNameField";
import { FrenzyItemRow } from "./FrenzyItemRow";
import { useCollectionLogFetch } from "@/hooks/useOsrsClans";
import { emptyItem } from "@/lib/frenzyCard";
import { collectionLogItems } from "@/lib/frenzyRate";
import type { FrenzyItem, FrenzySource } from "@/types/frenzyTemplate";

/** Names the card after a picked collection log page and adds the page's drops it lacks. */
function usePageFill(source: FrenzySource, onUpdate: (source: FrenzySource) => void): (page: string) => void {
  const fetchCollectionLog = useCollectionLogFetch();
  return (page) => {
    onUpdate({ ...source, name: page });
    fetchCollectionLog(page)
      .then((rows) => {
        const added = collectionLogItems(source.items, rows);
        onUpdate({ ...source, name: page, items: [...source.items.filter((i) => i.name), ...added] });
        toast.success(`Added ${added.length} drops from the ${page} collection log`);
      })
      .catch((err: unknown) => toast.error(String(err)));
  };
}

interface Props {
  tierName: string;
  source: FrenzySource;
  onUpdate: (source: FrenzySource) => void;
  onRemove: () => void;
}

/** One card of a tier: a source or a typed group. Its name is free text and its image is picked apart. */
export function CardEditor({ tierName, source, onUpdate, onRemove }: Props): React.ReactElement {
  const [picking, setPicking] = useState(false);
  const pickPage = usePageFill(source, onUpdate);
  const setItems = (items: FrenzyItem[]): void => onUpdate({ ...source, items });
  return (
    <section className="rounded-xl border bg-card p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="grid justify-items-center gap-1.5">
          <FrenzyCardImage source={source} />
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPicking(true)}>
            Change image
          </Button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Card name ({tierName})</Label>
            <CardNameField value={source.name} onChange={(name) => onUpdate({ ...source, name })} onPickPage={pickPage} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hover text</Label>
            <Input value={source.hovertext} onChange={(e) => onUpdate({ ...source, hovertext: e.target.value })} placeholder="Description shown on hover" className="h-8 text-sm" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {source.items.map((item, i) => (
          <FrenzyItemRow
            key={i}
            item={item}
            onUpdate={(next) => setItems(source.items.map((old, j) => (j === i ? next : old)))}
            onRemove={() => setItems(source.items.filter((_, j) => j !== i))}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setItems([...source.items, emptyItem()])}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add item
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Remove card
        </Button>
      </div>
      <CardImagePicker
        open={picking}
        onOpenChange={setPicking}
        cardName={source.name}
        items={source.items}
        onPick={(url) => onUpdate({ ...source, icon_url: url })}
      />
    </section>
  );
}
