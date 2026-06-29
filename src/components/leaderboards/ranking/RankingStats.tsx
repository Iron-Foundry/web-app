import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import {
  ALL_WOM_RANKS,
  GEM_RANK_HEX,
  GEM_RANK_COLOR,
  WOM_RANK_HEX,
  WOM_RANK_COLOR,
} from "@/lib/leaderboardRanks";
import type { RankingStats as RankingStatsType } from "@/types/leaderboard";

const GEM_RANK_ORDER = ["Zenyte", "Onyx", "Dragonstone", "Diamond", "Ruby", "Emerald", "Sapphire", "Achiever", "Guest"];

function PieBlock({
  data,
  hexMap,
  colorMap,
  label,
  compact,
}: {
  data: { name: string; value: number }[];
  hexMap: Record<string, string>;
  colorMap: Record<string, string>;
  label: string;
  compact: boolean;
}): React.ReactElement {
  const chartSize = compact ? 130 : 160;
  const total = data.reduce((s, d) => s + d.value, 0);
  const pct = (v: number) => total > 0 ? `${Math.round((v / total) * 100)}%` : "0%";
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <div className="grid grid-cols-1 gap-y-0.5">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 min-w-[110px]">
              <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: hexMap[d.name] ?? "#334155" }} />
              <span className={cn("text-xs", colorMap[d.name])}>{d.name}</span>
              <span className="ml-auto tabular-nums text-xs text-muted-foreground pl-1">{pct(d.value)}</span>
            </div>
          ))}
        </div>
        <div style={{ width: chartSize, height: chartSize, flexShrink: 0 }}>
          <PieChart width={chartSize} height={chartSize}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={compact ? 35 : 44}
              outerRadius={compact ? 58 : 74}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={hexMap[entry.name] ?? "#334155"} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]!;
                return (
                  <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-md">
                    <span className={cn("font-medium", colorMap[d.name as string])}>{d.name}</span>
                    <span className="ml-2 tabular-nums text-muted-foreground">{pct(d.value as number)}</span>
                  </div>
                );
              }}
            />
          </PieChart>
        </div>
      </div>
    </div>
  );
}

export function RankingStats({ stats, compact }: { stats: RankingStatsType; compact: boolean }): React.ReactElement {
  const womPieData = ALL_WOM_RANKS.map((r) => ({ name: r, value: stats.rank_distribution[r] ?? 0 })).filter((d) => d.value > 0);
  const clanPieData = GEM_RANK_ORDER.map((r) => ({ name: r, value: stats.clan_rank_distribution[r] ?? 0 })).filter((d) => d.value > 0);

  const presentClanRanks = GEM_RANK_ORDER.filter((cr) =>
    ALL_WOM_RANKS.some((wr) => (stats.rank_overlap[wr]?.[cr] ?? 0) > 0),
  );
  const barData = ALL_WOM_RANKS.map((wr) => {
    const bucket = stats.rank_overlap[wr] ?? {};
    const total = Object.values(bucket).reduce((s, n) => s + n, 0);
    const entry: Record<string, string | number> = { rank: wr };
    for (const cr of presentClanRanks) {
      entry[cr] = total > 0 ? Math.round(((bucket[cr] ?? 0) / total) * 100) : 0;
    }
    return entry;
  });

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex sm:flex-col justify-center gap-3 shrink-0">
        <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-center flex-1 sm:flex-none">
          <p className="text-xs text-muted-foreground mb-1">PvM contribution</p>
          <p className={cn("font-bold text-foreground", compact ? "text-xl" : "text-2xl")}>{stats.avg_boss_pct}%</p>
        </div>
        <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-center flex-1 sm:flex-none">
          <p className="text-xs text-muted-foreground mb-1">Skilling contribution</p>
          <p className={cn("font-bold text-foreground", compact ? "text-xl" : "text-2xl")}>{stats.avg_skill_pct}%</p>
        </div>
      </div>
      <div className="hidden sm:block w-px bg-border self-stretch" />
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <PieBlock data={clanPieData} hexMap={GEM_RANK_HEX} colorMap={GEM_RANK_COLOR} label="Clan Rank" compact={compact} />
        <div className="hidden sm:block w-px bg-border self-stretch" />
        <PieBlock data={womPieData} hexMap={WOM_RANK_HEX} colorMap={WOM_RANK_COLOR} label="WOM Rank" compact={compact} />
      </div>
      <div className="hidden sm:block w-px bg-border self-stretch" />
      <div className="flex flex-col justify-center gap-1 min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">Rank Overlap</p>
        <ResponsiveContainer width="100%" height={compact ? 160 : 200}>
          <BarChart data={barData} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
            <XAxis dataKey="rank" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
              tickFormatter={(v) => v.replace("No Rank", "None").replace("Rank ", "R")} />
            <YAxis unit="%" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 50, 100]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md space-y-0.5">
                    <p className={cn("font-medium mb-1", WOM_RANK_COLOR[label as string])}>{label}</p>
                    {[...payload].reverse().map((p) => (
                      <div key={p.dataKey as string} className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: p.fill }} />
                        <span className={cn(GEM_RANK_COLOR[p.dataKey as string])}>{p.dataKey}</span>
                        <span className="ml-auto tabular-nums text-muted-foreground pl-3">{p.value}%</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            {presentClanRanks.map((cr) => (
              <Bar key={cr} dataKey={cr} stackId="a" fill={GEM_RANK_HEX[cr] ?? "#334155"} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
