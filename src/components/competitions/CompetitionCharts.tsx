import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { fmtGained, fmtCompetitionLabel, VARIANT_LABELS } from "@/lib/competitions";
import type { RaidPlayerRow, RaidTeamRow } from "@/lib/competitions";
import type { OvertimePlayerSeries, TeamRow, MetricParticipation } from "@/types/competitions";
import { useOwnRsns } from "@/hooks/useOwnRsns";

export const VARIANT_COLORS = [
  "var(--primary)",
  "hsl(0 82% 38%)",
];

export const TIMELINE_COLORS = [
  "hsl(44 72% 52%)",
  "hsl(160 70% 50%)",
  "hsl(340 80% 60%)",
  "hsl(220 82% 45%)",
  "hsl(35 40% 78%)",
];

export function timelineColor(index: number): string {
  if (index < TIMELINE_COLORS.length) return TIMELINE_COLORS[index]!;
  const hue = Math.round((index * 137.508) % 360);
  return `hsl(${hue} 65% 55%)`;
}

export function OvertimeTooltip({
  active, payload, label, metric,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; payload: Record<string, number | null> }>;
  label?: string;
  metric: string;
}) {
  if (!active || !payload?.length) return null;
  const visible = payload.filter((p) => p.value != null);
  if (!visible.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm text-xs min-w-[160px]">
      {label && (
        <p className="mb-1.5 font-medium text-muted-foreground">
          {new Date(label).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
      {visible.map((item) => {
        const original = item.payload[`__orig_${item.name}`] ?? item.value;
        return (
          <div key={item.name} className="flex items-center gap-2 py-0.5">
            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="font-medium text-foreground">{item.name}</span>
            <span className="ml-auto pl-3 tabular-nums text-muted-foreground">{fmtGained(original as number, metric)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ClassicChart({ participations, metric }: { participations: MetricParticipation[]; metric: string }) {
  const chartData = participations.slice(0, 10).map((p) => ({ name: p.player_name, gained: p.gained }));
  const config = { gained: { label: fmtCompetitionLabel(metric), color: "var(--primary)" } };
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tickFormatter={(v: number) => fmtGained(v, metric).replace(" xp", "")} tick={{ fontSize: 11 }} width={56} />
        <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmtGained(v as number, metric)} />} />
        <Bar dataKey="gained" fill="var(--color-gained)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function TeamChart({ teams, metric }: { teams: TeamRow[]; metric: string }) {
  const chartData = teams.map((t) => ({ name: t.team_name, gained: t.total_gained }));
  const config = { gained: { label: "Team Total", color: "hsl(var(--primary))" } };
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tickFormatter={(v: number) => fmtGained(v, metric).replace(" xp", "")} tick={{ fontSize: 11 }} width={56} />
        <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmtGained(v as number, metric)} />} />
        <Bar dataKey="gained" fill="var(--color-gained)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function TimelineChart({ series, metric, activePlayers }: {
  series: OvertimePlayerSeries[];
  metric: string;
  activePlayers: Set<string>;
}) {
  const allDates = Array.from(new Set(series.flatMap((s) => s.history.map((h) => h.date)))).sort();
  const maxValue = Math.max(1, ...series.flatMap((s) => s.history.map((h) => h.value)));
  const tieOffset = maxValue * 0.04;
  const lastKnown = new Map<string, number | null>(series.map((s) => [s.player_name, null]));

  const chartData = allDates.map((date) => {
    const point: Record<string, string | number | null> = { date };
    for (const s of series) {
      const h = s.history.find((h) => h.date === date);
      if (h !== undefined) lastKnown.set(s.player_name, h.value);
      point[s.player_name] = lastKnown.get(s.player_name) ?? null;
    }
    for (const s of series) {
      point[`__orig_${s.player_name}`] = point[s.player_name] ?? null;
    }
    const byValue = new Map<number, number[]>();
    series.forEach((s, i) => {
      const v = point[s.player_name];
      if (v == null || (v as number) === 0) return;
      const key = v as number;
      if (!byValue.has(key)) byValue.set(key, []);
      byValue.get(key)!.push(i);
    });
    for (const [, indices] of byValue) {
      if (indices.length < 2) continue;
      const mid = (indices.length - 1) / 2;
      indices.forEach((seriesIdx, offsetIdx) => {
        const name = series[seriesIdx]!.player_name;
        point[name] = (point[name] as number) + (offsetIdx - mid) * tieOffset;
      });
    }
    return point;
  });

  const config = Object.fromEntries(series.map((s, i) => [s.player_name, { label: s.player_name, color: timelineColor(i) }]));

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-35} textAnchor="end"
          interval="preserveStartEnd" minTickGap={60}
          tickFormatter={(v: string) => new Date(v).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} />
        <YAxis tickFormatter={(v: number) => fmtGained(v, metric).replace(" xp", "")} tick={{ fontSize: 11 }} width={56} />
        <ChartTooltip content={(props) => (
          <OvertimeTooltip
            active={props.active}
            payload={props.payload as Array<{ name: string; value: number; color: string; payload: Record<string, number | null> }> | undefined}
            label={props.label != null ? String(props.label) : undefined}
            metric={metric}
          />
        )} />
        {series.map((s, i) => activePlayers.has(s.player_name) ? (
          <Line key={s.player_name} dataKey={s.player_name} stroke={timelineColor(i)} strokeWidth={2} dot={false} connectNulls />
        ) : null)}
      </LineChart>
    </ChartContainer>
  );
}

export function PlayerFilterStrip({ series, activePlayers, onToggle }: {
  series: OvertimePlayerSeries[];
  activePlayers: Set<string>;
  onToggle: (name: string) => void;
}) {
  const ownRsns = useOwnRsns();
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pb-2">
      {series.map((s, i) => (
        <label key={s.player_name} className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground select-none">
          <input type="checkbox" checked={activePlayers.has(s.player_name)} onChange={() => onToggle(s.player_name)} className="sr-only" />
          <span className="inline-block h-2.5 w-2.5 rounded-sm shrink-0 opacity-80" style={{ backgroundColor: timelineColor(i) }} />
          <span className={cn(activePlayers.has(s.player_name) ? "text-foreground" : "line-through opacity-50", ownRsns.has(s.player_name.toLowerCase()) && "own-rsn")}>{s.player_name}</span>
        </label>
      ))}
    </div>
  );
}

export function RaidStackedChart({ rows, variants }: { rows: RaidPlayerRow[]; variants: string[] }) {
  const top10 = rows.slice(0, 10);
  const chartData = top10.map((r) => ({ name: r.player_name, ...Object.fromEntries(variants.map((v) => [v, r.variants[v] ?? 0])) }));
  const config = Object.fromEntries(variants.map((v, i) => [v, { label: VARIANT_LABELS[v] ?? fmtCompetitionLabel(v), color: VARIANT_COLORS[i] ?? VARIANT_COLORS[0] }]));
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
        <defs>
          <linearGradient id="raidHardmodeGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--primary)" /><stop offset="30%" stopColor="hsl(0 82% 38%)" /><stop offset="100%" stopColor="hsl(0 82% 38%)" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tickFormatter={(v: number) => v.toLocaleString()} tick={{ fontSize: 11 }} width={56} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {variants.map((v, i) => (
          <Bar key={v} dataKey={v} name={VARIANT_LABELS[v] ?? fmtCompetitionLabel(v)} stackId="raid"
            fill={i === 1 ? "url(#raidHardmodeGradient)" : (VARIANT_COLORS[i] ?? VARIANT_COLORS[0])}
            radius={i === variants.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

export function RaidTeamStackedChart({ teams, variants }: { teams: RaidTeamRow[]; variants: string[] }) {
  const chartData = teams.map((t) => ({ name: t.team_name, ...Object.fromEntries(variants.map((v) => [v, t.variants[v] ?? 0])) }));
  const config = Object.fromEntries(variants.map((v, i) => [v, { label: VARIANT_LABELS[v] ?? fmtCompetitionLabel(v), color: VARIANT_COLORS[i] ?? VARIANT_COLORS[0] }]));
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
        <defs>
          <linearGradient id="raidHardmodeGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--primary)" /><stop offset="30%" stopColor="hsl(0 82% 38%)" /><stop offset="100%" stopColor="hsl(0 82% 38%)" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tickFormatter={(v: number) => v.toLocaleString()} tick={{ fontSize: 11 }} width={56} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {variants.map((v, i) => (
          <Bar key={v} dataKey={v} name={VARIANT_LABELS[v] ?? fmtCompetitionLabel(v)} stackId="raid"
            fill={i === 1 ? "url(#raidHardmodeGradient)" : (VARIANT_COLORS[i] ?? VARIANT_COLORS[0])}
            radius={i === variants.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
