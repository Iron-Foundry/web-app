import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import type { FrenzyTeamHistory } from "@/types/frenzy";

interface Props {
  history: FrenzyTeamHistory;
}

export function FrenzyPointsChart({ history }: Props) {
  if (history.series.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No approved submissions yet.</p>;
  }

  const data = history.series.map((pt) => ({
    time: new Date(pt.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    points: Math.floor(pt.total_points),
    player: pt.player_rsn,
  }));

  return (
    <ChartContainer config={{}} className="h-[220px] w-full">
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const p = payload[0].payload as { time: string; points: number; player: string };
            return (
              <div className="rounded border border-border bg-card px-3 py-2 text-xs shadow-lg">
                <p className="font-medium mb-0.5">{p.time} — {p.player}</p>
                <p className="font-mono font-medium">{p.points.toLocaleString()} pts</p>
              </div>
            );
          }}
        />
        <Line
          type="stepAfter"
          dataKey="points"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
