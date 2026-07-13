import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { BonusEffect, CellModifier, SabotageAction } from "@/types/tilerace";

interface CellModifiersProps {
  modifiers: CellModifier[];
  onChange: (modifiers: CellModifier[]) => void;
}

const DEFAULTS: Record<CellModifier["type"], CellModifier> = {
  snakes_ladders: { type: "snakes_ladders", target_position: 1 },
  fog: { type: "fog", radius: 1 },
  bonus_penalty: { type: "bonus_penalty", effect: "extra_roll" },
  sabotage: { type: "sabotage", action: "steal_progress", amount: 1 },
};

export function CellModifiers({ modifiers, onChange }: CellModifiersProps): JSX.Element {
  function update(index: number, next: CellModifier): void {
    onChange(modifiers.map((m, i) => (i === index ? next : m)));
  }

  function add(type: CellModifier["type"]): void {
    onChange([...modifiers, DEFAULTS[type]]);
  }

  function remove(index: number): void {
    onChange(modifiers.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2 pt-2">
      <Label className="text-xs">Modifiers</Label>
      {modifiers.map((mod, i) => (
        <div key={i} className="rounded-md border border-border/60 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-muted-foreground">
              {mod.type.replace("_", " ")}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(i)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          {mod.type === "snakes_ladders" && (
            <Input
              type="number"
              min={1}
              value={mod.target_position}
              onChange={(e) =>
                update(i, { ...mod, target_position: Math.max(1, Number(e.target.value)) })
              }
              className="h-7 text-xs"
              placeholder="Target position"
            />
          )}
          {mod.type === "fog" && (
            <Input
              type="number"
              min={1}
              value={mod.radius}
              onChange={(e) => update(i, { ...mod, radius: Math.max(1, Number(e.target.value)) })}
              className="h-7 text-xs"
              placeholder="Radius"
            />
          )}
          {mod.type === "bonus_penalty" && (
            <select
              value={mod.effect}
              onChange={(e) =>
                update(i, { ...mod, effect: e.target.value as BonusEffect })
              }
              className="h-7 w-full rounded-md border bg-background text-xs px-2"
            >
              <option value="extra_roll">Extra roll</option>
              <option value="skip_turn">Skip turn</option>
              <option value="reroll">Re-roll</option>
            </select>
          )}
          {mod.type === "sabotage" && (
            <div className="space-y-1.5">
              <select
                value={mod.action}
                onChange={(e) =>
                  update(i, { ...mod, action: e.target.value as SabotageAction })
                }
                className="h-7 w-full rounded-md border bg-background text-xs px-2"
              >
                <option value="steal_progress">Steal progress</option>
                <option value="block">Block</option>
              </select>
              <Input
                type="number"
                min={0}
                value={mod.amount}
                onChange={(e) =>
                  update(i, { ...mod, amount: Math.max(0, Number(e.target.value)) })
                }
                className="h-7 text-xs"
                placeholder="Amount"
              />
            </div>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => add("snakes_ladders")}>
          + Jump
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => add("fog")}>
          + Fog
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => add("bonus_penalty")}>
          + Bonus
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => add("sabotage")}>
          + Sabotage
        </Button>
      </div>
    </div>
  );
}
