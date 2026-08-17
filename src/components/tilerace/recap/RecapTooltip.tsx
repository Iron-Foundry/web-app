interface TooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
}

interface Props {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  names?: Record<string, string>;
}

/** One tooltip for every recap chart: the row label, then a line per series. */
export function RecapTooltip({ active, label, payload, names }: Props): JSX.Element | null {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-border bg-card px-3 py-2 text-xs shadow-lg space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => {
        const key = String(entry.name ?? "");
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-muted-foreground">{names?.[key] ?? key}</span>
            <span className="font-mono font-medium ml-auto pl-3">
              {Number(entry.value ?? 0).toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
