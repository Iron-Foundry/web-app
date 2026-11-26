import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { fmtGained, fmtCompetitionLabel } from "@/lib/competitions";
import type { TeamRow, MetricParticipation } from "@/types/competitions";

export const VARIANT_COLORS = [
  "var(--primary)",
  "hsl(0 82% 38%)",
];

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
