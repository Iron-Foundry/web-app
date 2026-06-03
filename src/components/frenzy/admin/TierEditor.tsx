import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemPicker } from "./ItemPicker";
import { BossPicker } from "./BossPicker";
import type { FrenzyItem, FrenzySource, FrenzyTierData, OsrsItem, OsrsBoss } from "@/types/frenzy";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

interface Props {
  tiers: Record<string, FrenzyTierData>;
  onChange: (tiers: Record<string, FrenzyTierData>) => void;
}

function emptyItem(): FrenzyItem {
  return { name: "", points: 10, required: 1, duplicate_required: 1, icon_url: null };
}

function emptySource(): FrenzySource {
  return { name: "", hovertext: "", icon_url: "", items: [emptyItem()] };
}

function ItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: FrenzyItem;
  onUpdate: (item: FrenzyItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded border bg-muted/30 p-2 space-y-1.5">
      <div className="flex items-center gap-2">
        {item.icon_url && (
          <img src={item.icon_url} alt={item.name} className="h-5 w-5 object-contain shrink-0" />
        )}
        <div className="flex-1">
          <ItemPicker
            value={item.name}
            onSelect={(osrs: OsrsItem) =>
              onUpdate({ ...item, name: osrs.name, icon_url: osrs.icon_url })
            }
          />
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <Label className="text-[10px] text-muted-foreground">Points</Label>
          <Input
            type="number"
            value={item.points}
            onChange={(e) => onUpdate({ ...item, points: Number(e.target.value) })}
            className="h-6 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Required</Label>
          <Input
            type="number"
            min={1}
            value={item.required}
            onChange={(e) => onUpdate({ ...item, required: Number(e.target.value) })}
            className="h-6 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Dup required</Label>
          <Input
            type="number"
            min={1}
            value={item.duplicate_required}
            onChange={(e) => onUpdate({ ...item, duplicate_required: Number(e.target.value) })}
            className="h-6 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function SourceSection({
  tierName,
  source,
  sourceIndex,
  onUpdate,
  onRemove,
}: {
  tierName: string;
  source: FrenzySource;
  sourceIndex: number;
  onUpdate: (s: FrenzySource) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  function updateItem(index: number, updated: FrenzyItem) {
    const items = [...source.items];
    items[index] = updated;
    onUpdate({ ...source, items });
  }

  function removeItem(index: number) {
    onUpdate({ ...source, items: source.items.filter((_, i) => i !== index) });
  }

  function addItem() {
    onUpdate({ ...source, items: [...source.items, emptyItem()] });
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 p-2.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 flex-1 text-left text-sm font-medium"
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {source.name || <span className="text-muted-foreground italic">Unnamed source</span>}
          <span className="ml-1 text-xs text-muted-foreground">({source.items.length} items)</span>
        </button>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Source (boss)</Label>
            <BossPicker
              value={source.name}
              onSelect={(b: OsrsBoss) => onUpdate({ ...source, name: b.name, icon_url: b.icon_url })}
              placeholder="Search boss..."
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Hover text</Label>
            <Input
              value={source.hovertext}
              onChange={(e) => onUpdate({ ...source, hovertext: e.target.value })}
              className="h-7 text-xs"
              placeholder="Description shown on hover"
            />
          </div>
          <div className="space-y-1.5">
            {source.items.map((item, i) => (
              <ItemRow
                key={i}
                item={item}
                onUpdate={(updated) => updateItem(i, updated)}
                onRemove={() => removeItem(i)}
              />
            ))}
            <Button variant="outline" size="sm" onClick={addItem} className="w-full h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add Item
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TierEditor({ tiers, onChange }: Props) {
  const tierNames = Object.keys(tiers);
  const [activeTier, setActiveTier] = useState(tierNames[0] ?? "");
  const [newTierName, setNewTierName] = useState("");

  const tierData = tiers[activeTier] ?? { sources: [] };

  function updateSources(sources: FrenzySource[]) {
    onChange({ ...tiers, [activeTier]: { ...tierData, sources } });
  }

  function updateSource(index: number, updated: FrenzySource) {
    const next = [...tierData.sources];
    next[index] = updated;
    updateSources(next);
  }

  function removeSource(index: number) {
    updateSources(tierData.sources.filter((_, i) => i !== index));
  }

  function addSource() {
    updateSources([...tierData.sources, emptySource()]);
  }

  function addTier() {
    const name = newTierName.trim();
    if (!name || tiers[name]) return;
    onChange({ ...tiers, [name]: { sources: [] } });
    setActiveTier(name);
    setNewTierName("");
  }

  function removeTier(name: string) {
    const next = { ...tiers };
    delete next[name];
    onChange(next);
    if (activeTier === name) {
      setActiveTier(Object.keys(next)[0] ?? "");
    }
  }

  return (
    <div className="space-y-3">
      {/* Tier tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        {tierNames.map((t) => (
          <div key={t} className="flex items-center gap-0.5">
            <button
              onClick={() => setActiveTier(t)}
              className={`px-3 py-1 rounded-l-md text-sm font-medium transition-colors ${
                activeTier === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
            <button
              onClick={() => removeTier(t)}
              className={`px-1.5 py-1 rounded-r-md text-sm transition-colors ${
                activeTier === t
                  ? "bg-primary/80 text-primary-foreground hover:bg-destructive"
                  : "bg-muted text-muted-foreground hover:text-destructive"
              }`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <Input
            value={newTierName}
            onChange={(e) => setNewTierName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTier()}
            placeholder="New tier..."
            className="h-7 text-xs w-28"
          />
          <Button size="sm" variant="outline" onClick={addTier} className="h-7 text-xs px-2">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Sources for active tier */}
      {activeTier && (
        <div className="space-y-2">
          {tierData.sources.map((source, i) => (
            <SourceSection
              key={i}
              tierName={activeTier}
              source={source}
              sourceIndex={i}
              onUpdate={(updated) => updateSource(i, updated)}
              onRemove={() => removeSource(i)}
            />
          ))}
          <Button variant="outline" size="sm" onClick={addSource} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>
      )}
    </div>
  );
}
