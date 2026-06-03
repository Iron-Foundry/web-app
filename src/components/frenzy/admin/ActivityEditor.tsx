import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActivityPicker } from "./ActivityPicker";
import type { FrenzyActivity, OsrsActivity } from "@/types/frenzy";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  activities: FrenzyActivity[];
  onChange: (activities: FrenzyActivity[]) => void;
}

function emptyActivity(): FrenzyActivity {
  return {
    name: "",
    point_step: 10,
    tier1: 100,
    tier2: 500,
    tier3: 1000,
    tier4: 5000,
    multiplier: 1,
    unit: "KC",
    req_factor: 1,
  };
}

function ActivityRow({
  activity,
  index,
  onChange,
  onRemove,
}: {
  activity: FrenzyActivity;
  index: number;
  onChange: (updated: FrenzyActivity) => void;
  onRemove: () => void;
}) {
  function set<K extends keyof FrenzyActivity>(key: K, value: FrenzyActivity[K]) {
    onChange({ ...activity, [key]: value });
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <ActivityPicker
            value={activity.name}
            onSelect={(a: OsrsActivity) => onChange({ ...activity, name: a.name })}
            placeholder="Activity name..."
          />
        </div>
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
              value={activity[t]}
              onChange={(e) => set(t, Number(e.target.value))}
              className="h-7 text-xs"
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Points/tier</Label>
          <Input
            type="number"
            value={activity.point_step}
            onChange={(e) => set("point_step", Number(e.target.value))}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">T4 multiplier</Label>
          <Input
            type="number"
            step="0.1"
            value={activity.multiplier}
            onChange={(e) => set("multiplier", Number(e.target.value))}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Unit</Label>
          <Input
            value={activity.unit}
            onChange={(e) => set("unit", e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Req factor</Label>
          <Input
            type="number"
            step="0.1"
            value={activity.req_factor}
            onChange={(e) => set("req_factor", Number(e.target.value))}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

export function ActivityEditor({ activities, onChange }: Props) {
  function update(index: number, updated: FrenzyActivity) {
    const next = [...activities];
    next[index] = updated;
    onChange(next);
  }

  function remove(index: number) {
    onChange(activities.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...activities, emptyActivity()]);
  }

  return (
    <div className="space-y-2">
      {activities.map((act, i) => (
        <ActivityRow
          key={i}
          activity={act}
          index={i}
          onChange={(updated) => update(i, updated)}
          onRemove={() => remove(i)}
        />
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Activity
      </Button>
    </div>
  );
}
