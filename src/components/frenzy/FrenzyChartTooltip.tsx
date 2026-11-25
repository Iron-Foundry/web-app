interface TooltipEntry {
  name: string;
  value: number;
  color?: string;
  fill?: string;
}

export function FrenzyChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }): React.ReactElement | null {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-border bg-card px-3 py-2 text-xs shadow-lg space-y-1">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          {(p.fill ?? p.color) && <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.fill ?? p.color }} />}
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-mono font-medium ml-auto pl-3">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
