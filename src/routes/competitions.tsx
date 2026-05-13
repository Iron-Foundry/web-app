import { useState, useEffect } from "react";
import { createRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { rootRoute } from "./__root";
import { registerPage } from "@/lib/permissions";
import {
  fmtCompetitionLabel, fmtGained, fmtCompDate, rankEmoji, statusColor,
  buildTeamRows, sanitizeParticipations, buildMetricTabs, buildRaidRows,
  buildRaidTeamRows, VARIANT_LABELS,
} from "@/lib/competitions";
import type { TabDescriptor, RaidPlayerRow, RaidTeamRow } from "@/lib/competitions";
import {
  useCompetitionList, useCompetitionMetricMap, useMetricDetail,
} from "@/hooks/useCompetitions";
import { CompetitionSkeleton } from "@/components/skeletons/CompetitionSkeleton";
import type { Competition, MetricParticipation, TeamRow } from "@/types/competitions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronDown, ChevronRight } from "lucide-react";

registerPage({
  id: "competitions",
  label: "Competitions",
  description: "View multi-metric competition standings and charts.",
  defaults: { read: [], create: [], edit: [], delete: [] },
});

export const competitionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/competitions",
  component: () => <CompetitionsPage />,
});

// ---------------------------------------------------------------------------
// Palette for raid variant segments
// ---------------------------------------------------------------------------

const VARIANT_COLORS = [
  "var(--primary)",
  "hsl(var(--chart-2, 200 70% 55%))",
];

// ---------------------------------------------------------------------------
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

// Single-metric sub-components (unchanged behaviour)
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

  if (isLoading) return <CompetitionSkeleton />;
  if (!detail) return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      Failed to load data. Try again shortly.
    </p>
  );

  const sanitized = sanitizeParticipations(detail.participations);
  const isTeam = detail.type === "team";
  const teams = isTeam ? buildTeamRows(sanitized) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium text-muted-foreground">Top 10 by Gained</p>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {isTeam ? <TeamChart teams={teams} metric={metric} /> : <ClassicChart participations={sanitized} metric={metric} />}
        </CardContent>
      </Card>
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
  const extraCols = variants.length + 1; // one per variant + Total
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
  const rows = buildRaidRows(variantData);
  const teams = isTeam ? buildRaidTeamRows(rows) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium text-muted-foreground">Top 10 by Total KC</p>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {isTeam
            ? <RaidTeamStackedChart teams={teams} variants={tab.variants} />
            : <RaidStackedChart rows={rows} variants={tab.variants} />}
        </CardContent>
      </Card>
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

export default function CompetitionsPage() {
  const { data: competitions = [], isLoading: compsLoading } = useCompetitionList();
  const { data: metricMap = {} } = useCompetitionMetricMap();

  const [selectedId, setSelectedId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("");

  const effectiveSelectedId = selectedId || (() => {
    const auto = competitions.find((c) => c.status === "ongoing") ?? competitions.find((c) => c.status === "upcoming");
    return auto ? String(auto.id) : "";
  })();

  const metrics = effectiveSelectedId ? (metricMap[effectiveSelectedId] ?? []) : [];
  const tabs = buildMetricTabs(metrics);
  const firstTabKey = tabs[0] ? (tabs[0].kind === "raid" ? tabs[0].groupKey : tabs[0].metric) : "";
  const effectiveTab = activeTab || firstTabKey;


  function handleCompSelect(id: string) {
    setSelectedId(id);
    const newMetrics = metricMap[id] ?? [];
    const newTabs = buildMetricTabs(newMetrics);
    const first = newTabs[0];
    setActiveTab(first ? (first.kind === "raid" ? first.groupKey : first.metric) : "");
  }

  const selected = competitions.find((c) => String(c.id) === effectiveSelectedId);
  const activeTabDescriptor = tabs.find(
    (t) => (t.kind === "raid" ? t.groupKey : t.metric) === effectiveTab,
  );

  const grouped = {
    ongoing: competitions.filter((c) => c.status === "ongoing"),
    upcoming: competitions.filter((c) => c.status === "upcoming"),
    finished: competitions.filter((c) => c.status === "finished"),
  };

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Competitions</h1>
      </div>

      <div className="flex items-center gap-3">
        <Select value={effectiveSelectedId} onValueChange={handleCompSelect} disabled={compsLoading}>
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
              </div>
            </div>
            <div className="mt-2">
              <CompetitionCountdownBanner comp={selected} />
            </div>
          </CardContent>
        </Card>
      )}

      {selected && metrics.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">No metrics configured for this competition yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Staff can add metrics at Members / Staff / Competitions.</p>
          </CardContent>
        </Card>
      )}

      {selected && tabs.length > 0 && (
        <div className="space-y-4">
          <ToggleGroup
            type="single"
            variant="outline"
            value={effectiveTab}
            onValueChange={(v) => { if (v) setActiveTab(v); }}
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
