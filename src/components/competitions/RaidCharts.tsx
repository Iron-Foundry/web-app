import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { fmtCompetitionLabel, VARIANT_LABELS } from "@/lib/competitions";
import type { RaidPlayerRow, RaidTeamRow } from "@/lib/competitionRows";
import { VARIANT_COLORS } from "./CompetitionCharts";

/** The stacked raid charts: one bar per player or team, one segment per raid variant. */

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
