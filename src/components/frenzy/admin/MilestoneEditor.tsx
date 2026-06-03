import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BossPicker } from "./BossPicker";
import type { FrenzyMilestone, OsrsBoss } from "@/types/frenzy";
import { Plus, Trash2 } from "lucide-react";

const CATEGORIES = ["killcount", "experience", "cluescroll"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  killcount: "Kill Count",
  experience: "Experience",
  cluescroll: "Clue Scrolls",
};

const CLUE_TIERS = ["Beginner", "Easy", "Medium", "Hard", "Elite", "Master", "All"];
const SKILLS = [
  "Attack", "Strength", "Defence", "Ranged", "Prayer", "Magic", "Runecrafting",
  "Construction", "Hitpoints", "Agility", "Herblore", "Thieving", "Crafting",
  "Fletching", "Slayer", "Hunter", "Mining", "Smithing", "Fishing", "Cooking",
  "Firemaking", "Woodcutting", "Farming",
];

interface Props {
  milestones: Record<string, FrenzyMilestone[]>;
  onChange: (milestones: Record<string, FrenzyMilestone[]>) => void;
}

function emptyMilestone(name = ""): FrenzyMilestone {
  return {
    name,
    point_step: 10,
    tier1: 100,
    tier2: 500,
    tier3: 1000,
    tier4: 5000,
    multiplier: 1,
    unit: "",
    req_factor: 1,
  };
}

function MilestoneRow({
  milestone,
  category,
  onUpdate,
  onRemove,
}: {
  milestone: FrenzyMilestone;
  category: Category;
  onUpdate: (m: FrenzyMilestone) => void;
  onRemove: () => void;
}) {
  function set<K extends keyof FrenzyMilestone>(key: K, value: FrenzyMilestone[K]) {
    onUpdate({ ...milestone, [key]: value });
  }

  function renderNameInput() {
    if (category === "killcount") {
      return (
        <BossPicker
          value={milestone.name}
          onSelect={(b: OsrsBoss) => onUpdate({ ...milestone, name: b.name, unit: "KC" })}
          placeholder="Boss name..."
        />
      );
    }
    if (category === "experience") {
      return (
        <select
          value={milestone.name}
          onChange={(e) => onUpdate({ ...milestone, name: e.target.value, unit: "XP" })}
          className="h-8 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">Select skill...</option>
          {SKILLS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      );
    }
    // cluescroll
    return (
      <select
        value={milestone.name}
        onChange={(e) => onUpdate({ ...milestone, name: e.target.value, unit: "Scrolls" })}
        className="h-8 w-full rounded-md border bg-background px-2 text-sm"
      >
        <option value="">Select tier...</option>
        {CLUE_TIERS.map((t) => (
          <option key={t} value={`Clue Scrolls (${t})`}>
            Clue Scrolls ({t})
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1">{renderNameInput()}</div>
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(["tier1", "tier2", "tier3", "tier4"] as const).map((t, i) => (
          <div key={t}>
            <Label className="text-xs text-muted-foreground">T{i + 1} threshold</Label>
            <Input
              type="number"
              value={milestone[t]}
              onChange={(e) => set(t, Number(e.target.value))}
              className="h-7 text-xs"
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Points/tier</Label>
          <Input
            type="number"
            value={milestone.point_step}
            onChange={(e) => set("point_step", Number(e.target.value))}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">T4 multiplier</Label>
          <Input
            type="number"
            step="0.1"
            value={milestone.multiplier}
            onChange={(e) => set("multiplier", Number(e.target.value))}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Unit</Label>
          <Input
            value={milestone.unit}
            onChange={(e) => set("unit", e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

export function MilestoneEditor({ milestones, onChange }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>("killcount");

  const currentMilestones: FrenzyMilestone[] = milestones[activeCategory] ?? [];

  function updateCategory(entries: FrenzyMilestone[]) {
    onChange({ ...milestones, [activeCategory]: entries });
  }

  function update(index: number, updated: FrenzyMilestone) {
    const next = [...currentMilestones];
    next[index] = updated;
    updateCategory(next);
  }

  function remove(index: number) {
    updateCategory(currentMilestones.filter((_, i) => i !== index));
  }

  function add() {
    updateCategory([...currentMilestones, emptyMilestone()]);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {CATEGORY_LABELS[cat]}
            <span className="ml-1.5 text-xs opacity-70">
              {(milestones[cat] ?? []).length}
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {currentMilestones.map((m, i) => (
          <MilestoneRow
            key={i}
            milestone={m}
            category={activeCategory}
            onUpdate={(updated) => update(i, updated)}
            onRemove={() => remove(i)}
          />
        ))}
        <Button variant="outline" size="sm" onClick={add} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add {CATEGORY_LABELS[activeCategory]}
        </Button>
      </div>
    </div>
  );
}
