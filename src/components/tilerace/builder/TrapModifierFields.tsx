import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CellModifier } from "@/types/tilerace";

type TrapModifier = Extract<CellModifier, { type: "trap" }>;

interface TrapModifierFieldsProps {
  modifier: TrapModifier;
  onChange: (modifier: TrapModifier) => void;
}

/** The dice a trap rolls, chosen when it is placed rather than at landing. */
export function TrapModifierFields({
  modifier,
  onChange,
}: TrapModifierFieldsProps): JSX.Element {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Dice</Label>
          <Input
            type="number"
            min={1}
            max={5}
            value={modifier.dice_count}
            onChange={(e) =>
              onChange({
                ...modifier,
                dice_count: Math.min(5, Math.max(1, Number(e.target.value))),
              })
            }
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Faces</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={modifier.dice_sides}
            onChange={(e) =>
              onChange({
                ...modifier,
                dice_sides: Math.min(20, Math.max(1, Number(e.target.value))),
              })
            }
            className="h-7 text-xs"
          />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Sends a team back {modifier.dice_count} - {modifier.dice_count * modifier.dice_sides}{" "}
        tile(s). Each team springs this trap once.
      </p>
    </div>
  );
}
