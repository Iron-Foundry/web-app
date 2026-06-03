import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { TEAM_COLORS } from "@/lib/frenzy";
import type { FrenzyTeamHistory } from "@/types/frenzy";

interface Props {
  history: FrenzyTeamHistory;
}

export function FrenzyPlayerChart({ history }: Props) {
  const entries = Object.entries(history.player_contribution)
    .map(([rsn, pts], i) => ({ rsn, points: Math.floor(pts), color: TEAM_COLORS[i % TEAM_COLORS.length] ?? "#888" }))
    .sort((a, b) => b.points - a.points);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No player contribution data yet.</p>;
  }

  return (
    <ChartContainer config={{}} className="h-[220px] w-full">
      <BarChart data={entries} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="rsn" tickLine={false} axisLine={false} width={90} tick={{ fontSize: 11 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const d = payload[0].payload as { rsn: string; points: number; color: string };
            return (
              <div className="rounded border border-border bg-card px-3 py-2 text-xs shadow-lg flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.rsn}</span>
                <span className="font-mono font-medium ml-auto pl-3">{d.points.toLocaleString()} pts</span>
              </div>
            );
          }}
        />
        <Bar dataKey="points" radius={[0, 4, 4, 0]}>
          {entries.map((e) => <Cell key={e.rsn} fill={e.color} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
