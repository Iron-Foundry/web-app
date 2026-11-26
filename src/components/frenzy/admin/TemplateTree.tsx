import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TierControls } from "./TierControls";
import { emptyItem, movedTier, orderedTiers, reorderTiers } from "@/lib/frenzyCard";
import type { FrenzyTierData } from "@/types/frenzyTemplate";

export interface CardRef {
  tier: string;
  index: number;
}

interface Props {
  tiers: Record<string, FrenzyTierData>;
  selected: CardRef | null;
  onSelect: (ref: CardRef) => void;
  onChange: (tiers: Record<string, FrenzyTierData>) => void;
}

function cardLabel(name: string): string {
  return name || "Unnamed card";
}

/** The tiers and their cards: a tree at lg widths, a select below. */
export function TemplateTree({ tiers, selected, onSelect, onChange }: Props): React.ReactElement {
  const [newTier, setNewTier] = useState("");
  const entries = orderedTiers(tiers);
  const names = entries.map(([name]) => name);
  const mobileTier = selected?.tier ?? names[0];

  const moveTier = (name: string, step: -1 | 1): void => onChange(reorderTiers(tiers, movedTier(names, name, step)));
  const setMultiplier = (name: string, multiplier: number | undefined): void =>
    onChange({ ...tiers, [name]: { ...tiers[name]!, multiplier } });
  const controls = (name: string): React.ReactElement => (
    <TierControls name={name} data={tiers[name]!} first={names[0] === name} last={names.at(-1) === name}
      onMove={(step) => moveTier(name, step)} onMultiplier={(m) => setMultiplier(name, m)} />
  );

  function addCard(tier: string): void {
    const data = tiers[tier]!;
    onChange({ ...tiers, [tier]: { ...data, sources: [...data.sources, { name: "", hovertext: "", icon_url: "", items: [emptyItem()] }] } });
    onSelect({ tier, index: data.sources.length });
  }

  function addTier(): void {
    const name = newTier.trim();
    if (!name || tiers[name]) return;
    onChange({ ...tiers, [name]: { sources: [], order: names.length } });
    setNewTier("");
  }

  function removeTier(name: string): void {
    const next = { ...tiers };
    delete next[name];
    onChange(next);
  }

  return (
    <>
      <div className="lg:hidden">
        <Select value={selected ? `${selected.tier}|${selected.index}` : ""} onValueChange={(v) => {
          const [tier, index] = v.split("|");
          onSelect({ tier: tier!, index: Number(index) });
        }}>
          <SelectTrigger aria-label="Card"><SelectValue placeholder="Pick a card" /></SelectTrigger>
          <SelectContent>
            {entries.flatMap(([tier, data]) =>
              data.sources.map((s, i) => <SelectItem key={`${tier}|${i}`} value={`${tier}|${i}`}>{tier} / {cardLabel(s.name)}</SelectItem>),
            )}
          </SelectContent>
        </Select>
        <div className="mt-2 flex flex-wrap gap-2">
          {mobileTier && (
            <>
              {controls(mobileTier)}
              <Button size="sm" variant="outline" onClick={() => addCard(mobileTier)}><Plus className="h-3 w-3 mr-1" />Add card to {mobileTier}</Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => removeTier(mobileTier)}>Remove tier {mobileTier}</Button>
            </>
          )}
          <Input value={newTier} onChange={(e) => setNewTier(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTier()} placeholder="New tier..." className="h-8 w-32 text-xs" />
          <Button size="sm" variant="outline" onClick={addTier} title="Add tier"><Plus className="h-3 w-3" /></Button>
        </div>
      </div>
      <nav aria-label="Tiers and cards" className="hidden lg:block self-start rounded-xl border bg-card p-2 text-sm">
        {entries.map(([tier, data]) => (
          <div key={tier} className="pb-2">
            <div className="flex items-center justify-between gap-2 px-2 pt-2 font-semibold">
              <span className="truncate">{tier}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeTier(tier)} title={`Remove tier ${tier}`}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="px-2 pb-1">{controls(tier)}</div>
            {data.sources.map((s, i) => {
              const active = selected?.tier === tier && selected.index === i;
              return (
                <button key={i} type="button" onClick={() => onSelect({ tier, index: i })}
                  className={`flex w-full justify-between gap-2 rounded-md py-1.5 pl-4 pr-2 text-left ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <span className="truncate">{cardLabel(s.name)}</span>
                  <span className="tabular-nums">{s.items.length}</span>
                </button>
              );
            })}
            <button type="button" onClick={() => addCard(tier)} className="flex items-center gap-1 py-1 pl-4 text-xs text-primary hover:underline">
              <Plus className="h-3 w-3" /> Add card
            </button>
          </div>
        ))}
        <div className="flex gap-1 p-2">
          <Input value={newTier} onChange={(e) => setNewTier(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTier()} placeholder="New tier..." className="h-7 text-xs" />
          <Button size="sm" variant="outline" onClick={addTier} className="h-7 px-2" title="Add tier"><Plus className="h-3 w-3" /></Button>
        </div>
      </nav>
    </>
  );
}
