import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { FrenzyChartTooltip } from "./FrenzyChartTooltip";
import type { FrenzyEventHistory } from "@/types/frenzy";

interface Props {
  history: FrenzyEventHistory;
  colors: Record<string, string>;
}

function stepRows(history: FrenzyEventHistory): Record<string, number | string>[] {
  const teams = history.teams;
  const stamps = Array.from(new Set(teams.flatMap((t) => t.series.map((p) => p.timestamp)))).sort();
  const latest: Record<number, number> = {};
  return stamps.map((ts) => {
    const row: Record<string, number | string> = {
      time: new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
    for (const t of teams) {
      const entry = t.series.find((p) => p.timestamp === ts);
      if (entry) latest[t.id] = entry.total_points;
      row[t.name] = Math.floor(latest[t.id] ?? 0);
    }
    return row;
  });
}

export function FrenzyRankChart({ history, colors }: Props): React.ReactElement {
  if (history.teams.every((t) => t.series.length === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-8">No submission history yet.</p>;
  }
  return (
    <ChartContainer config={{}} className="h-[260px] w-full">
      <LineChart data={stepRows(history)} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => v.toLocaleString()} tick={{ fontSize: 11 }} />
        <Tooltip content={<FrenzyChartTooltip />} />
        {history.teams.map((t) => (
          <Line key={t.id} type="stepAfter" dataKey={t.name} stroke={colors[t.name] ?? "#888"} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
