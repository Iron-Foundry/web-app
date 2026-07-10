import { glowToFilter, type GlowValues } from "./glow";

function TuneRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <span className="w-10 shrink-0 text-right tabular-nums">{value}</span>
    </label>
  );
}

interface GlowTunerProps {
  value: GlowValues;
  onChange: (glow: GlowValues) => void;
}

export function GlowTuner({ value, onChange }: GlowTunerProps) {
  const set = (patch: Partial<GlowValues>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-1 rounded-md border border-dashed border-border p-2 text-[11px]">
      <p className="font-medium text-muted-foreground">Item glow</p>
      <TuneRow label="Blur" value={value.blur} min={0} max={8} step={0.25} onChange={(v) => set({ blur: v })} />
      <TuneRow label="R" value={value.r} min={0} max={255} step={1} onChange={(v) => set({ r: v })} />
      <TuneRow label="G" value={value.g} min={0} max={255} step={1} onChange={(v) => set({ g: v })} />
      <TuneRow label="B" value={value.b} min={0} max={255} step={1} onChange={(v) => set({ b: v })} />
      <TuneRow label="Alpha" value={value.a} min={0} max={1} step={0.05} onChange={(v) => set({ a: v })} />
      <div className="flex items-center gap-2 pt-1">
        <span
          className="h-4 w-8 shrink-0 rounded border border-border"
          style={{ background: `rgba(${value.r}, ${value.g}, ${value.b}, ${value.a})` }}
        />
        <code className="break-all text-[10px] text-foreground">{glowToFilter(value)}</code>
      </div>
    </div>
  );
}
