import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Goal, GoalFormData } from "@/types/goals";

const INPUT_CLS = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function CheckboxGoalForm({ onSubmit, onCancel }: {
  onSubmit: (title: string, category: Goal["category"]) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const [title, setTitle]       = useState("");
  const [category, setCategory] = useState<Goal["category"]>("custom");
  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), category);
  }
  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-medium text-foreground">Goal title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Complete Dragon Slayer II" maxLength={80} className={INPUT_CLS} autoFocus />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as Goal["category"])} className={INPUT_CLS}>
            <option value="osrs">OSRS</option>
            <option value="clan">Clan</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={!title.trim()}>Add</Button>
      </div>
    </form>
  );
}

export function GoalForm({ initial, onSubmit, onCancel }: {
  initial?: Partial<GoalFormData>;
  onSubmit: (data: GoalFormData) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const [title, setTitle]       = useState(initial?.title    ?? "");
  const [category, setCategory] = useState<Goal["category"]>(initial?.category ?? "custom");
  const [current, setCurrent]   = useState(String(initial?.current ?? 0));
  const [target, setTarget]     = useState(String(initial?.target  ?? ""));
  const [unit, setUnit]         = useState(initial?.unit     ?? "");
  const isPreset = !!(initial?.wmMetricType);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!title.trim() || !target.trim()) return;
    onSubmit({
      title: title.trim(), category,
      current: Math.max(0, Number(current) || 0),
      target:  Math.max(1, Number(target)  || 1),
      unit: unit.trim(),
      wmMetricType: initial?.wmMetricType,
      wmMetric:     initial?.wmMetric,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
      {isPreset && <p className="text-xs text-muted-foreground">Progress auto-tracked from WOM. Set your target below.</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-medium text-foreground">Goal title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 99 Slayer" maxLength={80} className={INPUT_CLS} autoFocus={!isPreset} />
        </div>
        {!isPreset && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Goal["category"])} className={INPUT_CLS}>
              <option value="osrs">OSRS</option>
              <option value="clan">Clan</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Unit (optional)</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="xp, kc, slots..." maxLength={20} className={INPUT_CLS} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Current</label>
          <input type="number" min={0} value={current} onChange={(e) => setCurrent(e.target.value)} className={INPUT_CLS} readOnly={isPreset} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Target</label>
          <input type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Required" className={INPUT_CLS} autoFocus={isPreset} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={!title.trim() || !target.trim()}>{initial?.target != null ? "Save" : "Add"}</Button>
      </div>
    </form>
  );
}
