import { AlertTriangle, History, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FrenzyTemplateUpdate, FrenzyTierData } from "@/types/frenzyTemplate";

interface Props {
  draft: FrenzyTemplateUpdate;
  version: number | null;
  set: <K extends keyof FrenzyTemplateUpdate>(key: K, value: FrenzyTemplateUpdate[K]) => void;
  isSaving: boolean;
  onHistory: (() => void) | null;
  onCancel: () => void;
  onSave: () => void;
}

function unratedCount(tiers: Record<string, FrenzyTierData>): number {
  return Object.values(tiers).flatMap((t) => t.sources.flatMap((s) => s.items)).filter((i) => i.name && !i.kph).length;
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }): React.ReactElement {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" />
    </div>
  );
}

/** The template's own fields and actions, beside the card being edited. */
export function TemplateSummary(props: Props): React.ReactElement {
  const { draft, version, set } = props;
  const unrated = unratedCount(draft.tiers);
  return (
    <aside className="self-start rounded-xl border bg-card p-4 space-y-4">
      <TextField label="Name" value={draft.name} onChange={(v) => set("name", v)} />
      <TextField label="Description" value={draft.description ?? ""} onChange={(v) => set("description", v || null)} />
      {version !== null && <p className="text-xs text-muted-foreground">Version {version}</p>}
      {unrated > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-yellow-500">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {unrated === 1 ? "1 item has no kill rate" : `${unrated} items have no kill rate`}
        </p>
      )}
      <div className="grid gap-2">
        {props.onHistory && (
          <Button variant="outline" size="sm" onClick={props.onHistory}><History className="h-3.5 w-3.5 mr-1.5" />History</Button>
        )}
        <Button variant="outline" size="sm" onClick={props.onCancel}>Cancel</Button>
        <Button size="sm" onClick={props.onSave} disabled={props.isSaving || !draft.name.trim()}>
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {props.isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </aside>
  );
}
