import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemPicker } from "./ItemPicker";
import type { FrenzyItem, OsrsItem } from "@/types/frenzy";
import { Lock, LockOpen, Trash2 } from "lucide-react";

interface Props {
  item: FrenzyItem;
  onUpdate: (item: FrenzyItem) => void;
  onRemove: () => void;
}

/** Row editor for a single FrenzyItem inside a source in the TierEditor. */
export function FrenzyItemRow({ item, onUpdate, onRemove }: Props) {
  const hoursPerDrop =
    item.drop_denom != null && item.kph != null && item.kph > 0
      ? (item.drop_denom / item.kph).toFixed(1)
      : null;

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
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          onClick={() => onUpdate({ ...item, points_locked: !item.points_locked })}
          title={
            item.points_locked
              ? "Unlock points (allow recalculation)"
              : "Lock points (exclude from recalculation)"
          }
        >
          {item.points_locked ? (
            <Lock className="h-3 w-3 text-primary" />
          ) : (
            <LockOpen className="h-3 w-3" />
          )}
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
            Points
            {item.points_locked && <Lock className="h-2.5 w-2.5" />}
          </Label>
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

      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <Label className="text-[10px] text-muted-foreground">Drop denom</Label>
          <Input
            type="number"
            value={item.drop_denom ?? ""}
            onChange={(e) =>
              onUpdate({ ...item, drop_denom: e.target.value ? Number(e.target.value) : null })
            }
            className="h-6 text-xs"
            placeholder="e.g. 512"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">KPH</Label>
          <Input
            type="number"
            value={item.kph ?? ""}
            onChange={(e) =>
              onUpdate({ ...item, kph: e.target.value ? Number(e.target.value) : null })
            }
            className="h-6 text-xs"
            placeholder="e.g. 30"
          />
        </div>
        <div className="flex flex-col justify-end pb-1">
          {hoursPerDrop !== null && (
            <p className="text-[10px] text-muted-foreground leading-none">
              H/D: {hoursPerDrop}h
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
