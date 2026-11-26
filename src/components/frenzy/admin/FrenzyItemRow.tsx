import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemPicker } from "./ItemPicker";
import { RatePickerDialog } from "./RatePickerDialog";
import { hoursPerDrop, measuredBy, rateSourceLabel } from "@/lib/frenzyCard";
import { applyRateRow } from "@/lib/frenzyRate";
import type { FrenzyItem } from "@/types/frenzyTemplate";
import type { OsrsItem } from "@/types/frenzy";

interface Props {
  item: FrenzyItem;
  onUpdate: (item: FrenzyItem) => void;
  onRemove: () => void;
}

function numberOrNull(value: string): number | null {
  return value ? Number(value) : null;
}

function Field({ label, value, onChange, min }: { label: React.ReactNode; value: number | string; onChange: (v: string) => void; min?: number }): React.ReactElement {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">{label}</Label>
      <Input type="number" min={min} value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" />
    </div>
  );
}

function RateLine({ item, onChange }: { item: FrenzyItem; onChange: () => void }): React.ReactElement {
  const hours = hoursPerDrop(item);
  const source = item.rate_source ? rateSourceLabel(item.rate_source) : "Set by hand";
  const text = item.kph
    ? `${source} · ${item.drop_denom ? `1/${item.drop_denom.toLocaleString()}` : "-"} · ${item.kph}/h${item.kill_rate_source ? ` (${measuredBy(item.kill_rate_source)})` : ""}` +
      (hours !== null ? ` · ${hours.toLocaleString(undefined, { maximumFractionDigits: 1 })} h a drop` : "")
    : `${source} has no kill rate. Unbalanced until KPH is set.`;
  return (
    <div className="flex items-center gap-2 text-xs">
      <p className={`flex-1 flex items-center gap-1.5 ${item.kph ? "text-muted-foreground" : "text-yellow-500"}`}>
        {!item.kph && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
        {text}
      </p>
      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onChange} disabled={!item.name}>
        Change
      </Button>
    </div>
  );
}

/** One item of a card: its picker, its OSRSClans rate, and its scoring fields. */
export function FrenzyItemRow({ item, onUpdate, onRemove }: Props): React.ReactElement {
  const [picking, setPicking] = useState(false);
  const byHand = !item.rate_source || !item.kph;
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        {item.icon_url ? <img src={item.icon_url} alt={item.name} className="h-7 w-7 object-contain shrink-0" /> : <span className="h-7 w-7 shrink-0" />}
        <div className="flex-1 min-w-0">
          <ItemPicker value={item.name} onSelect={(osrs: OsrsItem) => onUpdate({ ...item, name: osrs.name, icon_url: osrs.icon_url })} />
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onRemove} title="Remove item">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <RateLine item={item} onChange={() => setPicking(true)} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Points</p>
          <p className="h-8 flex items-center text-sm tabular-nums">{item.points.toLocaleString()}</p>
        </div>
        <Field label="Required" min={1} value={item.required} onChange={(v) => onUpdate({ ...item, required: Number(v) })} />
        <Field label="Dup required" min={1} value={item.duplicate_required} onChange={(v) => onUpdate({ ...item, duplicate_required: Number(v) })} />
        {byHand && <Field label="Drop denom" value={item.drop_denom ?? ""} onChange={(v) => onUpdate({ ...item, drop_denom: numberOrNull(v) })} />}
        {byHand && <Field label="KPH" value={item.kph ?? ""} onChange={(v) => onUpdate({ ...item, kph: numberOrNull(v) })} />}
      </div>
      <RatePickerDialog
        open={picking}
        onOpenChange={setPicking}
        itemName={item.name}
        current={item.rate_source}
        onPick={(row) => onUpdate(applyRateRow(item, row))}
        onByHand={() => onUpdate({ ...item, rate_source: null, kill_rate_source: null, rate_category: null })}
      />
    </div>
  );
}
