import { useEffect, useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { rootRoute } from "./__root";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { cacheInvalidate, fetchCached } from "@/lib/cache";
import { registerPage } from "@/lib/permissions";
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
  component: CompetitionsPage,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Competition {
  id: number;
  title: string;
  metric: string;
  type: string;
  startsAt: string;
  endsAt: string;
  status: "upcoming" | "ongoing" | "finished";
  participantCount: number;
}

interface MetricParticipation {
  rank: number;
  player_name: string;
  team_name: string | null;
  gained: number;
  start: number;
  end: number;
}

interface MetricDetail {
  id: number;
  title: string;
  metric: string;
  type: string;
  status: string;
  startsAt: string;
  endsAt: string;
  participations: MetricParticipation[];
}

interface TeamRow {
  team_name: string;
  total_gained: number;
  rank: number;
  members: MetricParticipation[];
}

type MetricMap = Record<string, string[]>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SKILL_METRICS = new Set([
  "overall", "attack", "defence", "strength", "hitpoints", "ranged", "prayer",
  "magic", "cooking", "woodcutting", "fletching", "fishing", "firemaking",
  "crafting", "smithing", "mining", "herblore", "agility", "thieving", "slayer",
  "farming", "runecrafting", "hunter", "construction",
]);

function fmtLabel(metric: string): string {
  return metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtGained(v: number, metric: string): string {
  if (SKILL_METRICS.has(metric)) {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M xp`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}K xp`;
    return `${v} xp`;
  }
  return v.toLocaleString();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
}

function rankEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function statusColor(status: string): string {
  if (status === "ongoing") return "bg-green-500/15 text-green-400 border-green-500/20";
  if (status === "upcoming") return "bg-blue-500/15 text-blue-400 border-blue-500/20";
  return "bg-muted text-muted-foreground";
}

function buildTeamRows(participations: MetricParticipation[]): TeamRow[] {
  const teams: Record<string, MetricParticipation[]> = {};
  for (const p of participations) {
    const key = p.team_name ?? "__none__";
    (teams[key] ??= []).push(p);
  }
  return Object.entries(teams)
    .map(([key, members]) => ({
      team_name: key === "__none__" ? "No Team" : key,
      total_gained: members.reduce((s, m) => s + m.gained, 0),
      rank: 0,
      members: [...members].sort((a, b) => b.gained - a.gained),
    }))
    .sort((a, b) => b.total_gained - a.total_gained)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingRows() {
  return (
    <div className="space-y-2 py-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-8 rounded bg-muted/40 animate-pulse" />
      ))}
    </div>
  );
}

function ClassicChart({ participations, metric }: { participations: MetricParticipation[]; metric: string }) {
  const top10 = participations.slice(0, 10);
  const chartData = top10.map((p) => ({
    name: p.player_name,
    gained: p.gained,
  }));
  const config = { gained: { label: fmtLabel(metric), color: "hsl(var(--primary))" } };

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tickFormatter={(v: number) => fmtGained(v, metric).replace(" xp", "")}
          tick={{ fontSize: 11 }}
          width={56}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v) => fmtGained(v as number, metric)}
            />
          }
        />
        <Bar dataKey="gained" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

function TeamChart({ teams, metric }: { teams: TeamRow[]; metric: string }) {
  const chartData = teams.map((t) => ({
    name: t.team_name,
    gained: t.total_gained,
  }));
  const config = { gained: { label: "Team Total", color: "hsl(var(--primary))" } };

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tickFormatter={(v: number) => fmtGained(v, metric).replace(" xp", "")}
          tick={{ fontSize: 11 }}
          width={56}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v) => fmtGained(v as number, metric)}
            />
          }
        />
        <Bar dataKey="gained" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

function ClassicTable({ participations, metric }: { participations: MetricParticipation[]; metric: string }) {
  return (
    <div>
      <div className="grid grid-cols-[2.5rem_1fr_auto_auto_auto] gap-x-4 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">Start</span>
        <span className="text-right">End</span>
        <span className="text-right">Gained</span>
      </div>
      {participations.map((p) => (
        <div
          key={p.player_name}
          className="grid grid-cols-[2.5rem_1fr_auto_auto_auto] gap-x-4 px-3 py-2 items-center text-sm border-b border-border/50 last:border-0 hover:bg-muted/30"
        >
          <span className="font-medium text-muted-foreground">{rankEmoji(p.rank)}</span>
          <span className="truncate font-medium">{p.player_name}</span>
          <span className="text-right text-muted-foreground text-xs">{fmtGained(p.start, metric)}</span>
          <span className="text-right text-muted-foreground text-xs">{fmtGained(p.end, metric)}</span>
          <span className="text-right">
            <Badge variant="outline" className="font-mono text-xs">
              +{fmtGained(p.gained, metric)}
            </Badge>
          </span>
        </div>
      ))}
    </div>
  );
}

function TeamTable({ teams, metric }: { teams: TeamRow[]; metric: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div>
      <div className="grid grid-cols-[2.5rem_1fr_auto_auto] gap-x-4 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">
        <span>Rank</span>
        <span>Team</span>
        <span className="text-right">Members</span>
        <span className="text-right">Total Gained</span>
      </div>
      {teams.map((team) => {
        const open = expanded.has(team.team_name);
        return (
          <div key={team.team_name}>
            <button
              onClick={() => toggle(team.team_name)}
              className="w-full grid grid-cols-[2.5rem_1fr_auto_auto] gap-x-4 px-3 py-2 items-center text-sm border-b border-border/50 hover:bg-muted/30 text-left"
            >
              <span className="font-medium text-muted-foreground">{rankEmoji(team.rank)}</span>
              <span className="flex items-center gap-1.5 font-semibold">
                {open ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {team.team_name}
              </span>
              <span className="text-right text-xs text-muted-foreground">
                {team.members.length}
              </span>
              <span className="text-right">
                <Badge variant="outline" className="font-mono text-xs">
                  +{fmtGained(team.total_gained, metric)}
                </Badge>
              </span>
            </button>
            {open && (
              <div className="bg-muted/20 border-b border-border/50">
                {team.members.map((m) => (
                  <div
                    key={m.player_name}
                    className="grid grid-cols-[2.5rem_1fr_auto] gap-x-4 pl-10 pr-3 py-1.5 items-center text-xs text-muted-foreground"
                  >
                    <span />
                    <span>{m.player_name}</span>
                    <span className="text-right font-mono">
                      +{fmtGained(m.gained, metric)}
                    </span>
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
  const [detail, setDetail] = useState<MetricDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const token = getAuthToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetchCached<MetricDetail>(
      `${API_URL}/clan/competitions/${comp.id}/metric-detail?metric=${metric}`,
      { headers, cacheKey: `comp:${comp.id}:metric:${metric}`, ttl: 5 * 60 * 1000 },
    )
      .then(setDetail)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [comp.id, metric]);

  if (loading) return <LoadingRows />;
  if (error || !detail) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Failed to load data. Try again shortly.
      </p>
    );
  }

  const isTeam = detail.type === "team";
  const teams = isTeam ? buildTeamRows(detail.participations) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium text-muted-foreground">Top 10 by Gained</p>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {isTeam ? (
            <TeamChart teams={teams} metric={metric} />
          ) : (
            <ClassicChart participations={detail.participations} metric={metric} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium text-muted-foreground">
            {isTeam ? "Team Standings" : `All Participants (${detail.participations.length})`}
          </p>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {isTeam ? (
            <TeamTable teams={teams} metric={metric} />
          ) : (
            <ClassicTable participations={detail.participations} metric={metric} />
          )}
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

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [metricMap, setMetricMap] = useState<MetricMap>({});
  const [compsLoading, setCompsLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string>("");
  const [activeMetric, setActiveMetric] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const token = getAuthToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetchCached<Competition[]>(`${API_URL}/clan/competitions`, {
        cacheKey: "competitions:list",
        ttl: 5 * 60 * 1000,
      }),
      fetchCached<MetricMap>(`${API_URL}/clan/competitions/metric-map`, {
        headers,
        cacheKey: "competitions:metric-map",
      }),
    ])
      .then(([comps, map]) => {
        setCompetitions(comps);
        setMetricMap(map);
        // Auto-select the first ongoing or upcoming competition
        const auto = comps.find((c) => c.status === "ongoing") ?? comps.find((c) => c.status === "upcoming");
        if (auto) {
          setSelectedId(String(auto.id));
          const metrics = map[String(auto.id)] ?? [];
          if (metrics.length > 0) setActiveMetric(metrics[0]);
        }
      })
      .catch(() => {})
      .finally(() => setCompsLoading(false));
  }, [user]);

  // Update active metric when competition changes
  function handleCompSelect(id: string) {
    setSelectedId(id);
    const metrics = metricMap[id] ?? [];
    setActiveMetric(metrics.length > 0 ? metrics[0] : "");
    cacheInvalidate(`comp:${id}:metric:`);
  }

  if (loading || !user) return null;

  const selected = competitions.find((c) => String(c.id) === selectedId);
  const metrics = selectedId ? (metricMap[selectedId] ?? []) : [];

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

      {/* Competition selector */}
      <div className="flex items-center gap-3">
        <Select value={selectedId} onValueChange={handleCompSelect} disabled={compsLoading}>
          <SelectTrigger className="w-80">
            <SelectValue placeholder={compsLoading ? "Loading..." : "Select a competition"} />
          </SelectTrigger>
          <SelectContent>
            {grouped.ongoing.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Ongoing</div>
                {grouped.ongoing.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                ))}
              </>
            )}
            {grouped.upcoming.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Upcoming</div>
                {grouped.upcoming.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                ))}
              </>
            )}
            {grouped.finished.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Finished</div>
                {grouped.finished.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Competition header */}
      {selected && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold truncate">{selected.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {fmtDate(selected.startsAt)} - {fmtDate(selected.endsAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* Metric tabs */}
      {selected && metrics.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No metrics configured for this competition yet.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Staff can add metrics at Members / Staff / Competitions.
            </p>
          </CardContent>
        </Card>
      )}

      {selected && metrics.length > 0 && (
        <div className="space-y-4">
          <ToggleGroup
            type="single"
            variant="outline"
            value={activeMetric}
            onValueChange={(v) => { if (v) setActiveMetric(v); }}
          >
            {metrics.map((m) => (
              <ToggleGroupItem key={m} value={m}>
                {fmtLabel(m)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {activeMetric && (
            <MetricTabContent comp={selected} metric={activeMetric} />
          )}
        </div>
      )}
    </div>
  );
}
