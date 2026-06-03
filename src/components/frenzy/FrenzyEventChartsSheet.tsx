import { useState } from "react";
import { BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { FrenzyRankChart } from "./FrenzyRankChart";
import { useEventHistory } from "@/hooks/useFrenzy";
import { buildTeamColors } from "@/lib/frenzy";
import type { FrenzyEventHistory, FrenzyEventHistoryTeam } from "@/types/frenzy";

type TimeRange = "all" | "7d" | "30d" | "24h";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30d", label: "30 days" },
  { value: "7d", label: "7 days" },
  { value: "24h", label: "24h" },
];

function filterByTimeRange(teams: FrenzyEventHistoryTeam[], range: TimeRange): FrenzyEventHistoryTeam[] {
  if (range === "all") return teams;
  const cutoff = new Date();
  if (range === "24h") cutoff.setHours(cutoff.getHours() - 24);
  else if (range === "7d") cutoff.setDate(cutoff.getDate() - 7);
  else cutoff.setDate(cutoff.getDate() - 30);
  const iso = cutoff.toISOString();
  return teams.map((t) => ({ ...t, series: t.series.filter((p) => p.timestamp >= iso) }));
}

function buildStandingsData(teams: FrenzyEventHistoryTeam[], colorMap: Record<string, string>) {
  return teams
    .map((t) => ({
      name: t.name,
      points: t.series.length > 0 ? Math.floor(t.series[t.series.length - 1]!.total_points) : 0,
      color: colorMap[t.name] ?? "#888",
    }))
    .sort((a, b) => b.points - a.points);
}

function buildDailyData(teams: FrenzyEventHistoryTeam[]) {
  const fmt = (ts: string) =>
    new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const allDates = Array.from(new Set(teams.flatMap((t) => t.series.map((p) => fmt(p.timestamp)))));

  return allDates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const team of teams) {
      const dayPts = team.series.filter((p) => fmt(p.timestamp) === date);
      const gained = dayPts.reduce((acc, p, i, arr) => {
        const prev = i === 0 ? 0 : (arr[i - 1]?.total_points ?? 0);
        return acc + (p.total_points - prev);
      }, 0);
      row[team.name] = Math.floor(gained);
    }
    return row;
  });
}

function FrenzyTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; color?: string; fill?: string }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-border bg-card px-3 py-2 text-xs shadow-lg space-y-1">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          {(p.fill ?? p.color) && (
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.fill ?? p.color }} />
          )}
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-mono font-medium ml-auto pl-3">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

interface Props {
  eventName: string;
}

export function FrenzyEventChartsSheet({ eventName }: Props) {
  const [open, setOpen] = useState(false);
  const { data: history } = useEventHistory();

  const [hiddenTeams, setHiddenTeams] = useState<Set<number>>(new Set());
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const colorMap = buildTeamColors((history?.teams ?? []).map((t) => t.name));

  function toggleTeam(id: number) {
    setHiddenTeams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const visible = history?.teams.filter((t) => !hiddenTeams.has(t.id)) ?? [];
  const filtered = filterByTimeRange(visible, timeRange);
  const filteredHistory: FrenzyEventHistory | null = filtered.length > 0 ? { teams: filtered } : null;

  const standingsData = buildStandingsData(filtered, colorMap);
  const dailyData = buildDailyData(filtered);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart2 className="h-4 w-4 mr-1.5" />
          Charts
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto flex flex-col gap-0">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>{eventName} - Analytics</SheetTitle>
        </SheetHeader>

        <div className="px-4 py-3 border-b space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time range</p>
            <div className="flex gap-1.5 flex-wrap">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <PillButton key={opt.value} active={timeRange === opt.value} onClick={() => setTimeRange(opt.value)}>
                  {opt.label}
                </PillButton>
              ))}
            </div>
          </div>

          {history && history.teams.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Teams</p>
              <div className="flex gap-1.5 flex-wrap">
                {history.teams.map((team) => (
                  <PillButton key={team.id} active={!hiddenTeams.has(team.id)} onClick={() => toggleTeam(team.id)}>
                    {team.name}
                  </PillButton>
                ))}
                {hiddenTeams.size > 0 && (
                  <PillButton active={false} onClick={() => setHiddenTeams(new Set())}>
                    Show all
                  </PillButton>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8">
          {!history && <p className="text-sm text-muted-foreground">Loading history...</p>}

          {filteredHistory && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Standings</p>
                <div style={{ height: standingsData.length * 40 + 16 }}>
                  <ChartContainer config={{}} className="h-full w-full">
                    <BarChart layout="vertical" data={standingsData} margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<FrenzyTooltip />} />
                      <Bar dataKey="points" radius={[0, 4, 4, 0]}>
                        {standingsData.map((e) => <Cell key={e.name} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Points Over Time</p>
                <FrenzyRankChart history={filteredHistory} />
              </div>

              {dailyData.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Daily Points Gained</p>
                  <ChartContainer config={{}} className="h-[220px] w-full">
                    <BarChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
                      <Tooltip content={<FrenzyTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                      {filtered.map((t) => (
                        <Bar key={t.id} dataKey={t.name} stackId="a" fill={colorMap[t.name] ?? "#888"} />
                      ))}
                    </BarChart>
                  </ChartContainer>
                </div>
              )}

              {dailyData.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Daily Rate Comparison</p>
                  <ChartContainer config={{}} className="h-[220px] w-full">
                    <LineChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
                      <Tooltip content={<FrenzyTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                      {filtered.map((t) => (
                        <Line key={t.id} type="monotone" dataKey={t.name} stroke={colorMap[t.name] ?? "#888"} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      ))}
                    </LineChart>
                  </ChartContainer>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
