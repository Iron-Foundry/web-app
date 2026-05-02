import { useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { rootRoute } from "./__root";
import { useAuth } from "@/context/AuthContext";
import { registerPage } from "@/lib/permissions";
import {
  fmtCompetitionLabel, fmtGained, fmtCompDate, rankEmoji, statusColor, buildTeamRows,
} from "@/lib/competitions";
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
// Sub-components
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

  const isTeam = detail.type === "team";
  const teams = isTeam ? buildTeamRows(detail.participations) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium text-muted-foreground">Top 10 by Gained</p>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {isTeam ? <TeamChart teams={teams} metric={metric} /> : <ClassicChart participations={detail.participations} metric={metric} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium text-muted-foreground">
            {isTeam ? "Team Standings" : `All Participants (${detail.participations.length})`}
          </p>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {isTeam ? <TeamTable teams={teams} metric={metric} /> : <ClassicTable participations={detail.participations} metric={metric} />}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CompetitionsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: competitions = [], isLoading: compsLoading } = useCompetitionList();
  const { data: metricMap = {} } = useCompetitionMetricMap();

  const [selectedId, setSelectedId] = useState<string>("");
  const [activeMetric, setActiveMetric] = useState<string>("");

  // Auto-select first ongoing/upcoming when data loads and nothing selected
  const effectiveSelectedId = selectedId || (() => {
    const auto = competitions.find((c) => c.status === "ongoing") ?? competitions.find((c) => c.status === "upcoming");
    return auto ? String(auto.id) : "";
  })();

  const effectiveMetric = activeMetric || (metricMap[effectiveSelectedId]?.[0] ?? "");

  if (loading) return <CompetitionSkeleton />;
  if (!user) { void navigate({ to: "/login" }); return null; }

  function handleCompSelect(id: string) {
    setSelectedId(id);
    setActiveMetric(metricMap[id]?.[0] ?? "");
  }

  const selected = competitions.find((c) => String(c.id) === effectiveSelectedId);
  const metrics = effectiveSelectedId ? (metricMap[effectiveSelectedId] ?? []) : [];

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

      {selected && metrics.length > 0 && (
        <div className="space-y-4">
          <ToggleGroup type="single" variant="outline" value={effectiveMetric} onValueChange={(v) => { if (v) setActiveMetric(v); }}>
            {metrics.map((m) => <ToggleGroupItem key={m} value={m}>{fmtCompetitionLabel(m)}</ToggleGroupItem>)}
          </ToggleGroup>

          {effectiveMetric && <MetricTabContent comp={selected} metric={effectiveMetric} />}
        </div>
      )}

      <Separator className="hidden" />
    </div>
  );
}
