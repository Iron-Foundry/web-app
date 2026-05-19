import { useState, useEffect } from "react";
import { createRoute, useRouter } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { rootRoute } from "./__root";
import { registerPage } from "@/lib/permissions";
import {
  fmtCompetitionLabel, fmtGained, fmtCompDate, rankEmoji, statusColor,
  buildTeamRows, sanitizeParticipations, buildMetricTabs, buildRaidRows,
  buildRaidTeamRows, VARIANT_LABELS,
} from "@/lib/competitions";
import type { TabDescriptor, RaidPlayerRow, RaidTeamRow } from "@/lib/competitions";
import {
  useCompetitionList, useCompetitionMetricMap, useMetricDetail, useCompetitionOvertime,
} from "@/hooks/useCompetitions";
import { CompetitionSkeleton } from "@/components/skeletons/CompetitionSkeleton";
import type { Competition, MetricParticipation, OvertimePlayerSeries, TeamRow } from "@/types/competitions";
import metricsConfig from "@/competition-metrics.toml";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Check, ChevronDown, ChevronRight, Download, Eye, Link, X } from "lucide-react";

const METRIC_GROUPS: { name: string; metrics: string[] }[] = metricsConfig.groups;

registerPage({
  id: "competitions",
  label: "Competitions",
  description: "View multi-metric competition standings and charts.",
  defaults: { read: [], create: [], edit: [], delete: [] },
});

export const competitionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/competitions/$compId",
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: () => <CompetitionsPage />,
});

// ---------------------------------------------------------------------------
// Palette for raid variant segments
// ---------------------------------------------------------------------------

const VARIANT_COLORS = [
  "var(--primary)",
  "hsl(var(--chart-2, 200 70% 55%))",
];

const TIMELINE_COLORS = [
  "var(--primary)",
  "hsl(200 70% 55%)",
  "hsl(40 90% 55%)",
  "hsl(340 80% 60%)",
  "hsl(160 70% 50%)",
];

function timelineColor(index: number): string {
  if (index < TIMELINE_COLORS.length) return TIMELINE_COLORS[index];
  const hue = Math.round((index * 137.508) % 360);
  return `hsl(${hue} 65% 55%)`;
}

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

function useCountdown(targetIso: string): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return "0s";
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function CompetitionCountdownBanner({ comp }: { comp: Competition }) {
  const startCountdown = useCountdown(comp.startsAt);
  const endCountdown = useCountdown(comp.endsAt);

  if (comp.status === "upcoming") {
    return (
      <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-sm text-blue-400">
        <span className="font-medium shrink-0">Starting in:</span>
        <span className="font-mono">{startCountdown}</span>
      </div>
    );
  }
  if (comp.status === "ongoing") {
    return (
      <div className="inline-flex items-center gap-2 rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-sm text-green-400">
        <span className="font-medium shrink-0">Ending in:</span>
        <span className="font-mono">{endCountdown}</span>
      </div>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Single-metric sub-components
// ---------------------------------------------------------------------------

function ClassicChart({ participations, metric }: { participations: MetricParticipation[]; metric: string }) {
  const top10 = participations.slice(0, 10);
  const chartData = top10.map((p) => ({ name: p.player_name, gained: p.gained }));
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

function TeamChart({ teams, metric }: { teams: TeamRow[]; metric: string }) {
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

function OvertimeTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
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
          {new Date(label).toLocaleString(undefined, {
            month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </p>
      )}
      {visible.map((item) => (
        <div key={item.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="font-medium text-foreground">{item.name}</span>
          <span className="ml-auto pl-3 tabular-nums text-muted-foreground">
            {fmtGained(item.value, metric)}
          </span>
        </div>
      ))}
    </div>
  );
}

function TimelineChart({
  series,
  metric,
  activePlayers,
}: {
  series: OvertimePlayerSeries[];
  metric: string;
  activePlayers: Set<string>;
}) {
  const allDates = Array.from(
    new Set(series.flatMap((s) => s.history.map((h) => h.date))),
  ).sort();

  const chartData = allDates.map((date) => {
    const point: Record<string, string | number | null> = { date };
    for (const s of series) {
      const h = s.history.find((h) => h.date === date);
      point[s.player_name] = h ? h.value : null;
    }
    return point;
  });

  const config = Object.fromEntries(
    series.map((s, i) => [
      s.player_name,
      { label: s.player_name, color: timelineColor(i) },
    ]),
  );

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          angle={-35}
          textAnchor="end"
          interval="preserveStartEnd"
          minTickGap={60}
          tickFormatter={(v: string) =>
            new Date(v).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          }
        />
        <YAxis
          tickFormatter={(v: number) => fmtGained(v, metric).replace(" xp", "")}
          tick={{ fontSize: 11 }}
          width={56}
        />
        <ChartTooltip
          content={(props) => <OvertimeTooltip {...props} metric={metric} />}
        />
        {series.map((s, i) =>
          activePlayers.has(s.player_name) ? (
            <Line
              key={s.player_name}
              dataKey={s.player_name}
              stroke={timelineColor(i)}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ) : null,
        )}
      </LineChart>
    </ChartContainer>
  );
}

function PlayerFilterStrip({
  series,
  activePlayers,
  onToggle,
}: {
  series: OvertimePlayerSeries[];
  activePlayers: Set<string>;
  onToggle: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pb-2">
      {series.map((s, i) => (
        <label key={s.player_name} className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={activePlayers.has(s.player_name)}
            onChange={() => onToggle(s.player_name)}
            className="sr-only"
          />
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm shrink-0 opacity-80"
            style={{ backgroundColor: timelineColor(i) }}
          />
          <span className={activePlayers.has(s.player_name) ? "text-foreground" : "line-through opacity-50"}>
            {s.player_name}
          </span>
        </label>
      ))}
    </div>
  );
}

function ClassicTable({ participations, metric }: { participations: MetricParticipation[]; metric: string }) {
  return (
    <div>
      <div className="grid grid-cols-[2.5rem_1fr_auto_auto_auto] gap-x-4 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">
        <span>Rank</span><span>Player</span>
        <span className="text-right">Start</span><span className="text-right">End</span><span className="text-right">Gained</span>
      </div>
      {participations.map((p) => (
        <div key={p.player_name} className="grid grid-cols-[2.5rem_1fr_auto_auto_auto] gap-x-4 px-3 py-2 items-center text-sm border-b border-border/50 last:border-0 hover:bg-muted/30">
          <span className="font-medium text-muted-foreground">{rankEmoji(p.rank)}</span>
          <span className="truncate font-medium">{p.player_name}</span>
          <span className="text-right text-muted-foreground text-xs">{fmtGained(p.start, metric)}</span>
          <span className="text-right text-muted-foreground text-xs">{fmtGained(p.end, metric)}</span>
          <span className="text-right"><Badge variant="outline" className="font-mono text-xs">+{fmtGained(p.gained, metric)}</Badge></span>
        </div>
      ))}
    </div>
  );
}

function TeamTable({ teams, metric }: { teams: TeamRow[]; metric: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  function toggle(name: string) {
    setExpanded((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  }
  return (
    <div>
      <div className="grid grid-cols-[2.5rem_1fr_auto_auto] gap-x-4 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">
        <span>Rank</span><span>Team</span><span className="text-right">Members</span><span className="text-right">Total Gained</span>
      </div>
      {teams.map((team) => {
        const open = expanded.has(team.team_name);
        return (
          <div key={team.team_name}>
            <button onClick={() => toggle(team.team_name)} className="w-full grid grid-cols-[2.5rem_1fr_auto_auto] gap-x-4 px-3 py-2 items-center text-sm border-b border-border/50 hover:bg-muted/30 text-left">
              <span className="font-medium text-muted-foreground">{rankEmoji(team.rank)}</span>
              <span className="flex items-center gap-1.5 font-semibold">
                {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                {team.team_name}
              </span>
              <span className="text-right text-xs text-muted-foreground">{team.members.length}</span>
              <span className="text-right"><Badge variant="outline" className="font-mono text-xs">+{fmtGained(team.total_gained, metric)}</Badge></span>
            </button>
            {open && (
              <div className="bg-muted/20 border-b border-border/50">
                {team.members.map((m) => (
                  <div key={m.player_name} className="grid grid-cols-[2.5rem_1fr_auto] gap-x-4 pl-10 pr-3 py-1.5 items-center text-xs text-muted-foreground">
                    <span /><span>{m.player_name}</span>
                    <span className="text-right font-mono">+{fmtGained(m.gained, metric)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MetricTabContent({ comp, metric }: { comp: Competition; metric: string }) {
  const { data: detail, isLoading } = useMetricDetail(comp.id, metric);
  const { data: overtime, isLoading: overtimeLoading } = useCompetitionOvertime(comp.id, metric);
  const [activePlayers, setActivePlayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (overtime?.series) {
      setActivePlayers(new Set(overtime.series.map((s) => s.player_name)));
    }
  }, [overtime?.series]);

  function togglePlayer(name: string) {
    setActivePlayers((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  if (isLoading) return <CompetitionSkeleton />;
  if (!detail) return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      Failed to load data. Try again shortly.
    </p>
  );

  const sanitized = sanitizeParticipations(detail.participations);
  const isTeam = detail.type === "team";
  const teams = isTeam ? buildTeamRows(sanitized) : [];

  const noHistory = overtime?.series.every((s) => s.history.length === 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-sm font-medium text-muted-foreground">Top 10 by Gained</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {isTeam ? <TeamChart teams={teams} metric={metric} /> : <ClassicChart participations={sanitized} metric={metric} />}
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-sm font-medium text-muted-foreground">Progress Over Time (Top 5)</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {overtimeLoading && <CompetitionSkeleton />}
            {!overtimeLoading && overtime && !noHistory && (
              <>
                <PlayerFilterStrip series={overtime.series} activePlayers={activePlayers} onToggle={togglePlayer} />
                <TimelineChart series={overtime.series} metric={metric} activePlayers={activePlayers} />
              </>
            )}
            {!overtimeLoading && (noHistory || !overtime) && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {detail.status === "upcoming" ? "Competition hasn't started yet." : "No timeline data available."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium text-muted-foreground">
            {isTeam ? "Team Standings" : `All Participants (${sanitized.length})`}
          </p>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {isTeam ? <TeamTable teams={teams} metric={metric} /> : <ClassicTable participations={sanitized} metric={metric} />}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Raid group sub-components
// ---------------------------------------------------------------------------

function RaidStackedChart({ rows, variants }: { rows: RaidPlayerRow[]; variants: string[] }) {
  const top10 = rows.slice(0, 10);
  const chartData = top10.map((r) => ({
    name: r.player_name,
    ...Object.fromEntries(variants.map((v) => [v, r.variants[v] ?? 0])),
  }));
  const config = Object.fromEntries(
    variants.map((v, i) => [v, { label: VARIANT_LABELS[v] ?? fmtCompetitionLabel(v), color: VARIANT_COLORS[i] ?? VARIANT_COLORS[0] }]),
  );
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tickFormatter={(v: number) => v.toLocaleString()} tick={{ fontSize: 11 }} width={56} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {variants.map((v, i) => (
          <Bar
            key={v}
            dataKey={v}
            name={VARIANT_LABELS[v] ?? fmtCompetitionLabel(v)}
            stackId="raid"
            fill={VARIANT_COLORS[i] ?? VARIANT_COLORS[0]}
            radius={i === variants.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

function RaidTeamStackedChart({ teams, variants }: { teams: RaidTeamRow[]; variants: string[] }) {
  const chartData = teams.map((t) => ({
    name: t.team_name,
    ...Object.fromEntries(variants.map((v) => [v, t.variants[v] ?? 0])),
  }));
  const config = Object.fromEntries(
    variants.map((v, i) => [v, { label: VARIANT_LABELS[v] ?? fmtCompetitionLabel(v), color: VARIANT_COLORS[i] ?? VARIANT_COLORS[0] }]),
  );
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tickFormatter={(v: number) => v.toLocaleString()} tick={{ fontSize: 11 }} width={56} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {variants.map((v, i) => (
          <Bar
            key={v}
            dataKey={v}
            name={VARIANT_LABELS[v] ?? fmtCompetitionLabel(v)}
            stackId="raid"
            fill={VARIANT_COLORS[i] ?? VARIANT_COLORS[0]}
            radius={i === variants.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

function RaidClassicTable({ rows, variants }: { rows: RaidPlayerRow[]; variants: string[] }) {
  const extraCols = variants.length + 1;
  const gridCols = `2.5rem 1fr ${Array(extraCols).fill("auto").join(" ")}`;
  return (
    <div>
      <div
        className="gap-x-4 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border"
        style={{ display: "grid", gridTemplateColumns: gridCols }}
      >
        <span>Rank</span>
        <span>Player</span>
        {variants.map((v) => <span key={v} className="text-right">{VARIANT_LABELS[v] ?? fmtCompetitionLabel(v)}</span>)}
        <span className="text-right">Total</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.player_name}
          className="gap-x-4 px-3 py-2 items-center text-sm border-b border-border/50 last:border-0 hover:bg-muted/30"
          style={{ display: "grid", gridTemplateColumns: gridCols }}
        >
          <span className="font-medium text-muted-foreground">{rankEmoji(r.rank)}</span>
          <span className="truncate font-medium">{r.player_name}</span>
          {variants.map((v) => (
            <span key={v} className="text-right text-muted-foreground text-xs">
              {(r.variants[v] ?? 0).toLocaleString()}
            </span>
          ))}
          <span className="text-right">
            <Badge variant="outline" className="font-mono text-xs">+{r.total.toLocaleString()}</Badge>
          </span>
        </div>
      ))}
    </div>
  );
}

function RaidTeamTable({ teams, variants }: { teams: RaidTeamRow[]; variants: string[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  function toggle(name: string) {
    setExpanded((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  }
  const extraCols = variants.length + 1;
  const gridCols = `2.5rem 1fr auto ${Array(extraCols).fill("auto").join(" ")}`;
  const memberGridCols = `2.5rem 1fr ${Array(extraCols).fill("auto").join(" ")}`;

  return (
    <div>
      <div
        className="gap-x-4 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border"
        style={{ display: "grid", gridTemplateColumns: gridCols }}
      >
        <span>Rank</span>
        <span>Team</span>
        <span className="text-right">Members</span>
        {variants.map((v) => <span key={v} className="text-right">{VARIANT_LABELS[v] ?? fmtCompetitionLabel(v)}</span>)}
        <span className="text-right">Total</span>
      </div>
      {teams.map((team) => {
        const open = expanded.has(team.team_name);
        return (
          <div key={team.team_name}>
            <button
              onClick={() => toggle(team.team_name)}
              className="w-full gap-x-4 px-3 py-2 items-center text-sm border-b border-border/50 hover:bg-muted/30 text-left"
              style={{ display: "grid", gridTemplateColumns: gridCols }}
            >
              <span className="font-medium text-muted-foreground">{rankEmoji(team.rank)}</span>
              <span className="flex items-center gap-1.5 font-semibold">
                {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                {team.team_name}
              </span>
              <span className="text-right text-xs text-muted-foreground">{team.members.length}</span>
              {variants.map((v) => (
                <span key={v} className="text-right text-muted-foreground text-xs">
                  {(team.variants[v] ?? 0).toLocaleString()}
                </span>
              ))}
              <span className="text-right">
                <Badge variant="outline" className="font-mono text-xs">+{team.total.toLocaleString()}</Badge>
              </span>
            </button>
            {open && (
              <div className="bg-muted/20 border-b border-border/50">
                {team.members.map((m) => (
                  <div
                    key={m.player_name}
                    className="gap-x-4 pl-10 pr-3 py-1.5 items-center text-xs text-muted-foreground"
                    style={{ display: "grid", gridTemplateColumns: memberGridCols }}
                  >
                    <span />
                    <span>{m.player_name}</span>
                    {variants.map((v) => (
                      <span key={v} className="text-right font-mono">
                        {(m.variants[v] ?? 0).toLocaleString()}
                      </span>
                    ))}
                    <span className="text-right font-mono font-semibold">+{m.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RaidGroupContent({ comp, tab }: { comp: Competition; tab: Extract<TabDescriptor, { kind: "raid" }> }) {
  const results = tab.variants.map((v) => ({
    metric: v,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    query: useMetricDetail(comp.id, v),
  }));

  const primaryMetric = tab.variants[0]!;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data: overtime, isLoading: overtimeLoading } = useCompetitionOvertime(comp.id, primaryMetric);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [activePlayers, setActivePlayers] = useState<Set<string>>(new Set());

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (overtime?.series) {
      setActivePlayers(new Set(overtime.series.map((s) => s.player_name)));
    }
  }, [overtime?.series]);

  function togglePlayer(name: string) {
    setActivePlayers((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  const isLoading = results.some((r) => r.query.isLoading);
  if (isLoading) return <CompetitionSkeleton />;

  const anyFailed = results.some((r) => !r.query.data);
  if (anyFailed) return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      Failed to load data. Try again shortly.
    </p>
  );

  const variantData = results.map((r) => ({
    metric: r.metric,
    participations: r.query.data!.participations,
  }));

  const isTeam = results[0]?.query.data?.type === "team";
  const compStatus = results[0]?.query.data?.status ?? "finished";
  const rows = buildRaidRows(variantData);
  const teams = isTeam ? buildRaidTeamRows(rows) : [];

  const noHistory = overtime?.series.every((s) => s.history.length === 0);
  const primaryLabel = VARIANT_LABELS[primaryMetric] ?? fmtCompetitionLabel(primaryMetric);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-sm font-medium text-muted-foreground">Top 10 by Total KC</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {isTeam
              ? <RaidTeamStackedChart teams={teams} variants={tab.variants} />
              : <RaidStackedChart rows={rows} variants={tab.variants} />}
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-sm font-medium text-muted-foreground">
              {primaryLabel} Over Time (Top 5)
            </p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {overtimeLoading && <CompetitionSkeleton />}
            {!overtimeLoading && overtime && !noHistory && (
              <>
                <PlayerFilterStrip series={overtime.series} activePlayers={activePlayers} onToggle={togglePlayer} />
                <TimelineChart series={overtime.series} metric={primaryMetric} activePlayers={activePlayers} />
              </>
            )}
            {!overtimeLoading && (noHistory || !overtime) && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {compStatus === "upcoming" ? "Competition hasn't started yet." : "No timeline data available."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium text-muted-foreground">
            {isTeam ? "Team Standings" : `All Participants (${rows.length})`}
          </p>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {isTeam
            ? <RaidTeamTable teams={teams} variants={tab.variants} />
            : <RaidClassicTable rows={rows} variants={tab.variants} />}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function PreviewAsSelect({ onSelect }: { onSelect: (metric: string) => void }) {
  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger className="w-52 h-9 text-sm gap-1.5">
        <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="Preview metric..." />
      </SelectTrigger>
      <SelectContent>
        {METRIC_GROUPS.map((group) => (
          <SelectGroup key={group.name}>
            <SelectLabel>{group.name}</SelectLabel>
            {group.metrics.map((m) => (
              <SelectItem key={m} value={m}>{fmtCompetitionLabel(m)}</SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function CompetitionsPage() {
  const { compId } = competitionDetailRoute.useParams();
  const { tab } = competitionDetailRoute.useSearch();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: competitions = [], isLoading: compsLoading } = useCompetitionList();
  const { data: metricMap = {}, isLoading: metricMapLoading } = useCompetitionMetricMap();

  const resolvedId = compId === "latest"
    ? String(
        competitions.find((c) => c.status === "ongoing")?.id
        ?? competitions.find((c) => c.status === "upcoming")?.id
        ?? "",
      )
    : compId;

  const selected = competitions.find((c) => String(c.id) === resolvedId);

  const metrics = resolvedId ? (metricMap[resolvedId] ?? []) : [];
  const tabs = buildMetricTabs(metrics);
  const firstTabKey = tabs[0] ? (tabs[0].kind === "raid" ? tabs[0].groupKey : tabs[0].metric) : "";
  const effectiveTab = tab || firstTabKey;

  // Determine if the current tab is outside the staff-configured list (preview mode)
  const configuredTabDescriptor = tabs.find(
    (t) => (t.kind === "raid" ? t.groupKey : t.metric) === effectiveTab,
  );
  const isPreviewMode = !!effectiveTab && !configuredTabDescriptor && !!selected;
  const activeTabDescriptor: TabDescriptor | undefined = configuredTabDescriptor ??
    (effectiveTab ? { kind: "single" as const, metric: effectiveTab, label: fmtCompetitionLabel(effectiveTab) } : undefined);

  function handleCompSelect(id: string) {
    void router.navigate({
      to: "/competitions/$compId",
      params: { compId: id },
    });
  }

  function handleTabChange(newTab: string) {
    if (!newTab) return;
    void router.navigate({
      to: "/competitions/$compId",
      params: { compId },
      search: { tab: newTab },
    });
  }

  // For raid groups, export using the primary variant metric
  const exportMetric = activeTabDescriptor?.kind === "raid"
    ? activeTabDescriptor.variants[0]
    : activeTabDescriptor?.metric;

  async function handleExport() {
    if (!selected || !exportMetric) return;
    setExporting(true);
    try {
      const url = `/embed/competition-top5.png?id=${resolvedId}&metric=${encodeURIComponent(exportMetric)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${selected.title.replace(/\s+/g, "-")}-top5.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Export failed:", err);
      setExportError(true);
      setTimeout(() => setExportError(false), 3000);
    } finally {
      setExporting(false);
    }
  }

  function copyShareLink() {
    if (!resolvedId) return;
    const epoch = Math.floor(Date.now() / 1000);
    const url = `${window.location.origin}/competitions/${resolvedId}?t=${epoch}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function exitPreview() {
    void router.navigate({
      to: "/competitions/$compId",
      params: { compId },
      search: firstTabKey ? { tab: firstTabKey } : {},
    });
  }

  const grouped = {
    ongoing: competitions.filter((c) => c.status === "ongoing"),
    upcoming: competitions.filter((c) => c.status === "upcoming"),
    finished: competitions.filter((c) => c.status === "finished"),
  };

  const noActiveCompetitions = !compsLoading && resolvedId === "";
  const notFound = !compsLoading && resolvedId !== "" && !selected;
  const metricsReady = !metricMapLoading;
  const noMetrics = metricsReady && !!selected && metrics.length === 0 && !isPreviewMode;

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Competitions</h1>
      </div>

      <div className="flex items-center gap-3">
        <Select value={resolvedId} onValueChange={handleCompSelect} disabled={compsLoading}>
          <SelectTrigger className="w-80">
            <SelectValue placeholder={compsLoading ? "Loading..." : "Select a competition"} />
          </SelectTrigger>
          <SelectContent>
            {grouped.ongoing.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Ongoing</div>
                {grouped.ongoing.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
              </>
            )}
            {grouped.upcoming.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Upcoming</div>
                {grouped.upcoming.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
              </>
            )}
            {grouped.finished.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Finished</div>
                {grouped.finished.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {noActiveCompetitions && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">No active competitions at this time.</p>
          </CardContent>
        </Card>
      )}

      {notFound && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">Competition not found.</p>
          </CardContent>
        </Card>
      )}

      {selected && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold truncate">{selected.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {fmtCompDate(selected.startsAt)} - {fmtCompDate(selected.endsAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={statusColor(selected.status)}>
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                </Badge>
                <Badge variant="outline">{selected.type === "team" ? "Team" : "Classic"}</Badge>
                <Badge variant="outline">{selected.participantCount} participants</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={copyShareLink}
                  title="Copy share link (busts Discord cache)"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="mt-2">
              <CompetitionCountdownBanner comp={selected} />
            </div>
          </CardContent>
        </Card>
      )}

      {selected && metricMapLoading && !effectiveTab && <CompetitionSkeleton />}

      {noMetrics && (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">No metrics configured for this competition yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Staff can add metrics at Members / Staff / Competitions.</p>
            </div>
            <div className="flex justify-center">
              <PreviewAsSelect onSelect={handleTabChange} />
            </div>
          </CardContent>
        </Card>
      )}

      {selected && (tabs.length > 0 || isPreviewMode) && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {tabs.length > 0 && (
              <ToggleGroup
                type="single"
                variant="outline"
                value={isPreviewMode ? "" : effectiveTab}
                onValueChange={handleTabChange}
              >
                {tabs.map((t) => (
                  <ToggleGroupItem
                    key={t.kind === "raid" ? t.groupKey : t.metric}
                    value={t.kind === "raid" ? t.groupKey : t.metric}
                  >
                    {t.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}

            <PreviewAsSelect onSelect={handleTabChange} />

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => void handleExport()}
              disabled={!exportMetric || exporting}
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting..." : exportError ? "Export failed" : "Export Top 5"}
            </Button>

            {isPreviewMode && activeTabDescriptor && (
              <div className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400">
                <Eye className="h-3 w-3 shrink-0" />
                <span>Previewing: {activeTabDescriptor.label}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-0.5 text-amber-400 hover:text-amber-300 hover:bg-transparent"
                  onClick={exitPreview}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {activeTabDescriptor?.kind === "single" && (
            <MetricTabContent comp={selected} metric={activeTabDescriptor.metric} />
          )}
          {activeTabDescriptor?.kind === "raid" && (
            <RaidGroupContent comp={selected} tab={activeTabDescriptor} />
          )}
        </div>
      )}

      <Separator className="hidden" />
    </div>
  );
}
