import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

/** An "HH:MM" time in five-minute steps, from the product's own selects. */
export function TimePicker({ value, onChange, disabled }: Props): React.ReactElement {
  const [h, m] = value ? value.split(":") : ["", ""];
  return (
    <div className="flex items-center gap-1">
      <Select value={h || undefined} onValueChange={(hh) => onChange(`${hh}:${m || "00"}`)} disabled={disabled}>
        <SelectTrigger className="h-9 flex-1" aria-label="Hour"><SelectValue placeholder="HH" /></SelectTrigger>
        <SelectContent>{HOURS.map((hh) => <SelectItem key={hh} value={hh}>{hh}</SelectItem>)}</SelectContent>
      </Select>
      <span className="shrink-0 text-sm text-muted-foreground">:</span>
      <Select value={m || undefined} onValueChange={(mm) => onChange(`${h}:${mm}`)} disabled={disabled || !h}>
        <SelectTrigger className="h-9 flex-1" aria-label="Minute"><SelectValue placeholder="MM" /></SelectTrigger>
        <SelectContent>{MINUTES.map((mm) => <SelectItem key={mm} value={mm}>{mm}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
