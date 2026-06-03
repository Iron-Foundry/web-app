import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { TEAM_COLORS } from "@/lib/frenzy";
import type { FrenzyEventHistory } from "@/types/frenzy";

interface Props {
  history: FrenzyEventHistory;
}

function FrenzyTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; color?: string }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-border bg-card px-3 py-2 text-xs shadow-lg space-y-1">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-mono font-medium ml-auto pl-3">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function FrenzyRankChart({ history }: Props) {
  const teams = history.teams;

  if (teams.every((t) => t.series.length === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-8">No submission history yet.</p>;
  }

  const allTimestamps = Array.from(
    new Set(teams.flatMap((t) => t.series.map((p) => p.timestamp))),
  ).sort();

  const teamLatest: Record<number, number> = {};
  teams.forEach((t) => (teamLatest[t.id] = 0));

  const chartData = allTimestamps.map((ts) => {
    const row: Record<string, number | string> = {
      time: new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
    teams.forEach((t) => {
      const entry = t.series.find((p) => p.timestamp === ts);
      if (entry) teamLatest[t.id] = entry.total_points;
      row[t.name] = Math.floor(teamLatest[t.id] ?? 0);
    });
    return row;
  });

  return (
    <ChartContainer config={{}} className="h-[260px] w-full">
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
        <Tooltip content={<FrenzyTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
        {teams.map((t, i) => (
          <Line
            key={t.id}
            type="stepAfter"
            dataKey={t.name}
            stroke={TEAM_COLORS[i % TEAM_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
