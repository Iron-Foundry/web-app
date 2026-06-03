import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FrenzyMultiplier, FrenzyTierData } from "@/types/frenzy";
import { Plus, Trash2, X } from "lucide-react";

interface Props {
  multipliers: FrenzyMultiplier[];
  tiers: Record<string, FrenzyTierData>;
  onChange: (multipliers: FrenzyMultiplier[]) => void;
}

function getAllSourceNames(tiers: Record<string, FrenzyTierData>): string[] {
  const names = new Set<string>();
  for (const tier of Object.values(tiers)) {
    for (const source of tier.sources ?? []) {
      if (source.name) names.add(source.name);
    }
  }
  return Array.from(names);
}

function getAllItemNames(tiers: Record<string, FrenzyTierData>): string[] {
  const names = new Set<string>();
  for (const tier of Object.values(tiers)) {
    for (const source of tier.sources ?? []) {
      for (const item of source.items ?? []) {
        if (item.name) names.add(item.name);
      }
    }
  }
  return Array.from(names);
}

function MultiSelect({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1 flex flex-wrap gap-1 min-h-8 rounded-md border bg-background p-1">
        {selected.map((s) => (
          <span
            key={s}
            className="flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-xs"
          >
            {s}
            <button onClick={() => onToggle(s)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <select
          className="h-6 border-0 bg-transparent text-xs focus:outline-none"
          value=""
          onChange={(e) => {
            if (e.target.value && !selected.includes(e.target.value)) {
              onToggle(e.target.value);
            }
            e.target.value = "";
          }}
        >
          <option value="">+ Add...</option>
          {options
            .filter((o) => !selected.includes(o))
            .map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}

function MultiplierRow({
  mult,
  sourceNames,
  itemNames,
  onUpdate,
  onRemove,
}: {
  mult: FrenzyMultiplier;
  sourceNames: string[];
  itemNames: string[];
  onUpdate: (m: FrenzyMultiplier) => void;
  onRemove: () => void;
}) {
  function set<K extends keyof FrenzyMultiplier>(key: K, value: FrenzyMultiplier[K]) {
    onUpdate({ ...mult, [key]: value });
  }

  function toggleAffects(src: string) {
    const next = mult.affects.includes(src)
      ? mult.affects.filter((s) => s !== src)
      : [...mult.affects, src];
    set("affects", next);
  }

  function toggleRequirement(item: string) {
    const next = mult.requirement.includes(item)
      ? mult.requirement.filter((r) => r !== item)
      : [...mult.requirement, item];
    set("requirement", next);
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={mult.name}
              onChange={(e) => set("name", e.target.value)}
              className="h-7 text-xs"
              placeholder="Multiplier name"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Factor (e.g. 1.25)</Label>
            <Input
              type="number"
              step="0.05"
              value={mult.factor}
              onChange={(e) => set("factor", Number(e.target.value))}
              className="h-7 text-xs"
            />
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Input
          value={mult.description}
          onChange={(e) => set("description", e.target.value)}
          className="h-7 text-xs"
          placeholder="Describe what this multiplier does"
        />
      </div>
      <MultiSelect
        label="Applies to sources"
        options={sourceNames}
        selected={mult.affects}
        onToggle={toggleAffects}
      />
      <MultiSelect
        label="Unlock requirements (items)"
        options={itemNames}
        selected={mult.requirement}
        onToggle={toggleRequirement}
      />
    </div>
  );
}

export function MultiplierEditor({ multipliers, tiers, onChange }: Props) {
  const sourceNames = getAllSourceNames(tiers);
  const itemNames = getAllItemNames(tiers);

  function update(index: number, updated: FrenzyMultiplier) {
    const next = [...multipliers];
    next[index] = updated;
    onChange(next);
  }

  function remove(index: number) {
    onChange(multipliers.filter((_, i) => i !== index));
  }

  function add() {
    onChange([
      ...multipliers,
      { name: "", description: "", affects: [], factor: 1.25, requirement: [] },
    ]);
  }

  return (
    <div className="space-y-2">
      {multipliers.map((m, i) => (
        <MultiplierRow
          key={i}
          mult={m}
          sourceNames={sourceNames}
          itemNames={itemNames}
          onUpdate={(updated) => update(i, updated)}
          onRemove={() => remove(i)}
        />
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Multiplier
      </Button>
    </div>
  );
}
