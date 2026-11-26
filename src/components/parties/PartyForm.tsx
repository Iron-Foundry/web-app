import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VIBE_CLASS, VIBE_LABEL } from "@/lib/parties";
import { cn } from "@/lib/utils";
import type { NotificationCategory, Vibe } from "@/types/parties";
import { TimePicker } from "./TimePicker";

export interface PartyFormData {
  activity: string;
  description: string | null;
  vibe: Vibe;
  max_size: number;
  scheduled_at: string | null;
  notification_category_ids: string[];
  ttl_hours?: number;
}

interface Props {
  title: string;
  initial?: Partial<{ activity: string; description: string; vibe: Vibe; maxSize: number; scheduledDate: string; scheduledTime: string; selectedCategories: string[] }>;
  categories: NotificationCategory[];
  onClose: () => void;
  onSubmit: (data: PartyFormData) => void;
  saving: boolean;
  error?: string | null;
  showTtl?: boolean;
}

const LABEL = "grid gap-1.5 text-sm text-muted-foreground";
const CHOICE = "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors";

/** The create and edit form of a party, in a dialog. */
export function PartyForm({ title, initial = {}, categories, onClose, onSubmit, saving, error, showTtl }: Props): React.ReactElement {
  const [activity, setActivity] = useState(initial.activity ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [vibe, setVibe] = useState<Vibe>(initial.vibe ?? "chill");
  const [maxSize, setMaxSize] = useState(initial.maxSize ?? 5);
  const [scheduledDate, setScheduledDate] = useState(initial.scheduledDate ?? "");
  const [scheduledTime, setScheduledTime] = useState(initial.scheduledTime ?? "");
  const [ttlHours, setTtlHours] = useState(4);
  const [categoryIds, setCategoryIds] = useState<string[]>(initial.selectedCategories ?? []);
  const [localError, setLocalError] = useState<string | null>(null);

  const toggleCategory = (id: string): void =>
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  function handleSubmit(): void {
    if (!activity.trim()) { setLocalError("Activity is required."); return; }
    setLocalError(null);
    onSubmit({
      activity: activity.trim(),
      description: description.trim() || null,
      vibe,
      max_size: maxSize,
      scheduled_at: scheduledDate ? new Date(`${scheduledDate}T${scheduledTime || "00:00"}`).toISOString() : null,
      notification_category_ids: categoryIds,
      ttl_hours: ttlHours,
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <label className={LABEL}>Activity *<Input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="e.g. Theatre of Blood" maxLength={60} autoFocus /></label>
          <label className={LABEL}>Description<Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any requirements, notes…" maxLength={300} className="min-h-16 resize-none field-sizing-content" /></label>
          <div className={LABEL}>Vibe
            <div className="flex gap-2">
              {(["learning", "chill", "sweat"] as Vibe[]).map((v) => (
                <button key={v} type="button" aria-pressed={vibe === v} onClick={() => setVibe(v)} className={cn(CHOICE, "flex-1", vibe === v ? VIBE_CLASS[v] : "border-border text-muted-foreground hover:text-foreground")}>
                  {VIBE_LABEL[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={LABEL}>Max size<Input type="number" min={1} max={100} value={maxSize} onChange={(e) => setMaxSize(Math.max(1, parseInt(e.target.value, 10) || 1))} /></label>
            {showTtl && <label className={LABEL}>Expires after (hours)<Input type="number" min={0.5} max={24} step={0.5} value={ttlHours} onChange={(e) => setTtlHours(parseFloat(e.target.value) || 4)} /></label>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={LABEL}>Scheduled date<Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} /></label>
            <div className={LABEL}>Time<TimePicker value={scheduledTime} onChange={setScheduledTime} disabled={!scheduledDate} /></div>
          </div>
          {categories.length > 0 && (
            <div className={LABEL}>Notify for (optional)
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button key={c.id} type="button" aria-pressed={categoryIds.includes(c.id)} onClick={() => toggleCategory(c.id)} className={cn(CHOICE, categoryIds.includes(c.id) ? "border-primary/40 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(localError ?? error) && <p className="text-sm text-destructive">{localError ?? error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
