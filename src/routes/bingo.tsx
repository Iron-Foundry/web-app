import { useMemo, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis, Legend, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { rootRoute } from "./__root";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronUp, ChevronDown, Crown, Users, Swords, ScrollText, Trophy } from "lucide-react";
import rawData from "../bingo_comp_mapped.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BingoSubmission {
  tile_key: string;
  item_label: string | null;
  submitted_at: string;
  _note?: string;
}

interface Player {
  discord_user_id: string;
  is_captain: boolean;
  bingo_submissions: BingoSubmission[];
  wom_metrics: Record<string, number> | null;
}

interface Team {
  team_id: number;
  players: Record<string, Player>;
}

interface MappedData {
  generated_at: string;
  teams: Record<string, Team>;
  unmapped: {
    submissions_discord_id_not_matched: { tile_key: string; item_label: string | null; submitted_at: string; submitted_by_raw: number; team_id: number }[];
    wom_players_not_in_bingo_roster: { rsn: string; wom_team: string }[];
    bingo_members_not_in_wom: { rsn: string; team: string }[];
  };
}

const data = rawData as unknown as MappedData;

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const bingoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bingo",
  component: () => <BingoPage />,
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SKILL_METRICS = new Set([
  "overall","attack","defence","strength","hitpoints","ranged","prayer","magic",
  "cooking","woodcutting","fletching","fishing","firemaking","crafting","smithing",
  "mining","herblore","agility","thieving","slayer","farming","runecrafting",
  "hunter","construction","sailing",
]);

const BOSS_METRICS = new Set([
  "abyssal_sire","alchemical_hydra","amoxliatl","araxxor","artio","barrows_chests",
  "brutus","bryophyta","callisto","calvarion","cerberus","chambers_of_xeric",
  "chambers_of_xeric_challenge_mode","chaos_elemental","chaos_fanatic","commander_zilyana",
  "corporeal_beast","crazy_archaeologist","dagannoth_prime","dagannoth_rex","dagannoth_supreme",
  "deranged_archaeologist","doom_of_mokhaiotl","duke_sucellus","general_graardor","giant_mole",
  "grotesque_guardians","hespori","kalphite_queen","king_black_dragon","kraken","kreearra",
  "kril_tsutsaroth","lunar_chests","nex","nightmare","obor","phantom_muspah","phosanis_nightmare",
  "sarachnis","scorpia","scurrius","shellbane_gryphon","skotizo","sol_heredit","spindel",
  "tempoross","the_corrupted_gauntlet","the_gauntlet","the_hueycoatl","the_leviathan",
  "the_royal_titans","the_whisperer","theatre_of_blood","theatre_of_blood_hard_mode",
  "thermonuclear_smoke_devil","tombs_of_amascut","tombs_of_amascut_expert","tzkal_zuk",
  "tztok_jad","vardorvis","venenatis","vetion","vorkath","wintertodt","yama","zalcano","zulrah",
]);

const ACTIVITY_METRICS = new Set([
  "clue_scrolls_all","clue_scrolls_beginner","clue_scrolls_easy","clue_scrolls_medium",
  "clue_scrolls_hard","clue_scrolls_elite","clue_scrolls_master","collections_logged",
  "colosseum_glory","guardians_of_the_rift","last_man_standing","pvp_arena","soul_wars_zeal",
]);

const COMPUTED_METRICS = new Set(["ehp","ehb"]);

const TEAM_COLORS = [
  "hsl(220,70%,55%)","hsl(140,60%,45%)","hsl(280,65%,60%)","hsl(30,80%,55%)",
  "hsl(0,65%,55%)","hsl(180,55%,45%)","hsl(55,75%,50%)","hsl(320,65%,60%)",
];

const TEAM_NAMES = Object.keys(data.teams).sort();
const TEAM_COLOR: Record<string, string> = Object.fromEntries(
  TEAM_NAMES.map((n, i) => [n, TEAM_COLORS[i % TEAM_COLORS.length] ?? "#888"])
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtMetric(m: string) {
  return m.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function fmtGained(v: number, metric: string): string {
  if (SKILL_METRICS.has(metric)) {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M xp`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}K xp`;
    return `${v} xp`;
  }
  return v.toLocaleString();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function getMetricCat(m: string): "skill" | "boss" | "activity" | "computed" {
  if (SKILL_METRICS.has(m)) return "skill";
  if (BOSS_METRICS.has(m)) return "boss";
  if (ACTIVITY_METRICS.has(m)) return "activity";
  return "computed";
}

// Pre-flatten all players for quick lookups
interface FlatPlayer {
  rsn: string;
  teamName: string;
  teamColor: string;
  is_captain: boolean;
  wom_metrics: Record<string, number> | null;
  submissions: BingoSubmission[];
}

const ALL_PLAYERS: FlatPlayer[] = [];
for (const [teamName, team] of Object.entries(data.teams)) {
  for (const [rsn, player] of Object.entries(team.players)) {
    ALL_PLAYERS.push({
      rsn,
      teamName,
      teamColor: TEAM_COLOR[teamName] ?? "#888",
      is_captain: player.is_captain,
      wom_metrics: player.wom_metrics,
      submissions: player.bingo_submissions,
    });
  }
}

// Collect all metrics that have at least one nonzero value
const ACTIVE_METRICS = (() => {
  const sums: Record<string, number> = {};
  for (const p of ALL_PLAYERS) {
    if (!p.wom_metrics) continue;
    for (const [k, v] of Object.entries(p.wom_metrics)) {
      sums[k] = (sums[k] ?? 0) + v;
    }
  }
  return Object.keys(sums).filter(k => (sums[k] ?? 0) > 0);
})();

const ACTIVE_BY_CAT = {
  skill: ACTIVE_METRICS.filter(m => SKILL_METRICS.has(m)).sort(),
  boss: ACTIVE_METRICS.filter(m => BOSS_METRICS.has(m)).sort(),
  activity: ACTIVE_METRICS.filter(m => ACTIVITY_METRICS.has(m)).sort(),
  computed: ACTIVE_METRICS.filter(m => COMPUTED_METRICS.has(m)).sort(),
};

function getMetricVal(p: FlatPlayer, metric: string): number {
  return p.wom_metrics?.[metric] ?? 0;
}

function rankLabel(r: number) {
  if (r === 1) return "🥇";
  if (r === 2) return "🥈";
  if (r === 3) return "🥉";
  return `#${r}`;
}

// ---------------------------------------------------------------------------
// Shared chart tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload, metric }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; metric: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.fill }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-mono font-medium">{fmtGained(p.value, metric)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

function OverviewTab() {
  const teamStats = useMemo(() => {
    return TEAM_NAMES.map(name => {
      const team = data.teams[name]!;
      const players = Object.entries(team.players);
      const totalXP = players.reduce((s, [, p]) => s + (p.wom_metrics?.overall ?? 0), 0);
      const totalKC = players.reduce((s, [, p]) => {
        if (!p.wom_metrics) return s;
        return s + [...BOSS_METRICS].reduce((b, m) => b + (p.wom_metrics![m] ?? 0), 0);
      }, 0);
      const totalSubs = players.reduce((s, [, p]) => s + p.bingo_submissions.length, 0);
      const captain = players.find(([, p]) => p.is_captain)?.[0] ?? "—";
      const topPlayers = players
        .map(([rsn, p]) => ({ rsn, xp: p.wom_metrics?.overall ?? 0 }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 3);
      const maxXP = topPlayers[0]?.xp ?? 1;
      return { name, totalXP, totalKC, totalSubs, captain, topPlayers, maxXP, playerCount: players.length, color: TEAM_COLOR[name] };
    }).sort((a, b) => b.totalXP - a.totalXP);
  }, []);

  const chartData = teamStats.map(t => ({ name: t.name.length > 14 ? t.name.slice(0, 13) + "…" : t.name, fullName: t.name, xp: t.totalXP, color: t.color }));

  const totalSubs = ALL_PLAYERS.reduce((s, p) => s + p.submissions.length, 0);

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Teams", value: "8" },
          { icon: Crown, label: "Players", value: "97" },
          { icon: ScrollText, label: "Submissions", value: totalSubs.toLocaleString() },
          { icon: Swords, label: "Active Metrics", value: ACTIVE_METRICS.length.toString() },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 py-4">
              <Icon className="h-8 w-8 text-primary/70 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team XP chart */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="font-semibold text-sm">Team XP Ranking — Overall Gained</p>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ChartContainer config={{}} className="h-[260px] w-full">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 'auto']} tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip content={({ active, payload }) => (
                active && payload?.[0] ? (
                  <div className="rounded border border-border bg-card px-3 py-2 text-xs shadow">
                    <p className="font-medium">{payload[0].payload.fullName}</p>
                    <p className="text-muted-foreground">{fmtGained(payload[0].value as number, "overall")}</p>
                  </div>
                ) : null
              )} />
              <Bar dataKey="xp" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Team cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {teamStats.map((t, rank) => (
          <Card key={t.name} className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: t.color }} />
            <CardContent className="pt-5 pb-4 px-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm leading-tight">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    <Crown className="inline h-2.5 w-2.5 mr-0.5" />{t.captain}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0" style={{ borderColor: t.color, color: t.color }}>
                  #{rank + 1}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-xs font-mono font-semibold">{t.playerCount}</p>
                  <p className="text-[9px] text-muted-foreground">players</p>
                </div>
                <div>
                  <p className="text-xs font-mono font-semibold">{t.totalKC.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground">boss KC</p>
                </div>
                <div>
                  <p className="text-xs font-mono font-semibold">{t.totalSubs}</p>
                  <p className="text-[9px] text-muted-foreground">tiles</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">Top players (overall XP)</p>
                <div className="space-y-1.5">
                  {t.topPlayers.map((p, i) => (
                    <div key={p.rsn}>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">{rankLabel(i + 1)} {p.rsn}</span>
                        <span className="font-mono">{fmtGained(p.xp, "overall")}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(p.xp / t.maxXP) * 100}%`, background: t.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leaderboard Tab
// ---------------------------------------------------------------------------

function LeaderboardTab() {
  const [cat, setCat] = useState<"skill" | "boss" | "activity" | "computed">("skill");
  const [selectedMetric, setSelectedMetric] = useState("overall");
  const catMetrics = ACTIVE_BY_CAT[cat];

  // Ensure selected metric is valid for current cat
  const activeMetric = catMetrics.includes(selectedMetric) ? selectedMetric : (catMetrics[0] ?? "overall");

  const ranked = useMemo(() => {
    return ALL_PLAYERS
      .map(p => ({ ...p, gained: getMetricVal(p, activeMetric) }))
      .sort((a, b) => b.gained - a.gained)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [activeMetric]);

  const leader = ranked[0]?.gained ?? 1;

  const teamTotals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const p of ALL_PLAYERS) t[p.teamName] = (t[p.teamName] ?? 0) + getMetricVal(p, activeMetric);
    return Object.entries(t).sort((a, b) => b[1] - a[1]);
  }, [activeMetric]);

  const chartData = ranked.slice(0, 20).map(p => ({
    name: p.rsn.length > 14 ? p.rsn.slice(0, 13) + "…" : p.rsn,
    fullName: p.rsn,
    gained: p.gained,
    team: p.teamName,
    color: p.teamColor,
  }));

  return (
    <div className="flex gap-4 min-h-[600px]">
      {/* Sidebar metric list */}
      <div className="w-48 shrink-0 flex flex-col gap-2">
        <ToggleGroup type="single" value={cat} onValueChange={v => { if (v) { setCat(v as typeof cat); setSelectedMetric(ACTIVE_BY_CAT[v as typeof cat][0] ?? ""); } }} className="flex-col">
          {(["skill", "boss", "activity", "computed"] as const).map(c => (
            <ToggleGroupItem key={c} value={c} className="w-full justify-start text-xs capitalize">{c === "skill" ? "Skills" : c === "boss" ? "Bosses" : c === "activity" ? "Activities" : "Computed"}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Separator />
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 max-h-[520px]">
          {catMetrics.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMetric(m)}
              className={`w-full text-left text-[11px] px-2 py-1.5 rounded-sm transition-colors ${activeMetric === m ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {fmtMetric(m)}
            </button>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base">{fmtMetric(activeMetric)}</h2>
          <Badge variant="outline" className="text-[10px]">{cat}</Badge>
          <span className="text-xs text-muted-foreground ml-auto">{ranked.filter(p => p.gained > 0).length} players with gains</span>
        </div>

        {/* Top 20 chart */}
        <Card>
          <CardContent className="px-2 pt-3 pb-2">
            <div style={{ height: Math.max(220, chartData.length * 22) }}>
              <ChartContainer config={{}} className="h-full w-full">
                <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 60, top: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 'auto']} tickFormatter={v => cat === "skill" ? `${(v/1_000_000).toFixed(1)}M` : v.toLocaleString()} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip content={({ active, payload }) => (
                    active && payload?.[0] ? (
                      <div className="rounded border border-border bg-card px-3 py-2 text-xs shadow">
                        <p className="font-medium">{payload[0].payload.fullName}</p>
                        <p className="text-muted-foreground">{payload[0].payload.team}</p>
                        <p className="font-mono">{fmtGained(payload[0].value as number, activeMetric)}</p>
                      </div>
                    ) : null
                  )} />
                  <Bar dataKey="gained" radius={[0, 3, 3, 0]}>
                    {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Full ranked table */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="grid grid-cols-[2rem_1fr_7rem_6rem_4rem] gap-x-3 px-3 py-2 text-[10px] font-medium text-muted-foreground border-b border-border">
                  <span>#</span><span>Player</span><span>Team</span><span className="text-right">Gained</span><span className="text-right">%</span>
                </div>
                <div className="overflow-y-auto max-h-72">
                  {ranked.filter(p => p.gained > 0).map(p => (
                    <div key={p.rsn} className="grid grid-cols-[2rem_1fr_7rem_6rem_4rem] gap-x-3 px-3 py-1.5 text-xs border-b border-border/40 hover:bg-muted/30 items-center">
                      <span className="text-muted-foreground font-mono">{rankLabel(p.rank)}</span>
                      <span className="truncate font-medium">{p.rsn}</span>
                      <span className="truncate text-muted-foreground text-[10px]" style={{ color: p.teamColor }}>{p.teamName.split(" ")[0]}</span>
                      <span className="text-right font-mono">{fmtGained(p.gained, activeMetric)}</span>
                      <span className="text-right text-muted-foreground text-[10px]">{((p.gained / leader) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team aggregate */}
          <div>
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <p className="text-xs font-semibold">Team Totals</p>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {teamTotals.map(([name, total], i) => (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="truncate text-muted-foreground" style={{ color: TEAM_COLOR[name] }}>{name}</span>
                      <span className="font-mono ml-2 shrink-0">{fmtGained(total, activeMetric)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(total / (teamTotals[0]?.[1] ?? 1)) * 100}%`, background: TEAM_COLOR[name] }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare Tab
// ---------------------------------------------------------------------------

const ALL_METRICS_GROUPED = [
  { group: "Skills", options: ACTIVE_BY_CAT.skill },
  { group: "Bosses", options: ACTIVE_BY_CAT.boss },
  { group: "Activities", options: ACTIVE_BY_CAT.activity },
  { group: "Computed", options: ACTIVE_BY_CAT.computed },
];

function CompareTab() {
  const [mode, setMode] = useState<"teams" | "players">("teams");

  // Teams mode state
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set(TEAM_NAMES));
  const [teamMetrics, setTeamMetrics] = useState<string[]>(["overall", "ehp", "ehb"]);
  const [teamMetricInput, setTeamMetricInput] = useState("");

  // Players mode state
  const [teamFilter, setTeamFilter] = useState("__all__");
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [playerMetrics, setPlayerMetrics] = useState<string[]>(["overall"]);

  const availablePlayers = useMemo(() => {
    return ALL_PLAYERS.filter(p => teamFilter === "__all__" || p.teamName === teamFilter);
  }, [teamFilter]);

  // Teams chart data
  const teamsChartData = useMemo(() => {
    if (teamMetrics.length === 1) {
      const m = teamMetrics[0]!;
      return [...selectedTeams].map(name => ({
        name: name.length > 14 ? name.slice(0, 13) + "…" : name,
        fullName: name,
        value: Object.values(data.teams[name]!.players).reduce((s, p) => s + (p.wom_metrics?.[m] ?? 0), 0),
        color: TEAM_COLOR[name],
      })).sort((a, b) => b.value - a.value);
    }
    // Multiple metrics: grouped bar, x=team
    return [...selectedTeams].map(name => {
      const row: Record<string, string | number> = { name: name.length > 12 ? name.slice(0, 11) + "…" : name, fullName: name };
      for (const m of teamMetrics) {
        row[m] = Object.values(data.teams[name]!.players).reduce((s, p) => s + (p.wom_metrics?.[m] ?? 0), 0);
      }
      return row;
    });
  }, [selectedTeams, teamMetrics]);

  // Players chart data
  const playersChartData = useMemo(() => {
    if (selectedPlayers.size === 0) return [];
    if (playerMetrics.length === 1) {
      const m = playerMetrics[0]!;
      return [...selectedPlayers].map(rsn => {
        const p = ALL_PLAYERS.find(x => x.rsn === rsn)!;
        return { name: rsn, gained: getMetricVal(p, m), color: p.teamColor };
      }).sort((a, b) => b.gained - a.gained);
    }
    return [...selectedPlayers].map(rsn => {
      const p = ALL_PLAYERS.find(x => x.rsn === rsn)!;
      const row: Record<string, string | number> = { name: rsn };
      for (const m of playerMetrics) row[m] = getMetricVal(p, m);
      return row;
    });
  }, [selectedPlayers, playerMetrics]);

  function toggleTeam(name: string) {
    setSelectedTeams(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }

  function togglePlayer(rsn: string) {
    setSelectedPlayers(prev => {
      const n = new Set(prev);
      if (n.has(rsn)) { n.delete(rsn); return n; }
      if (n.size >= 8) return prev;
      n.add(rsn); return n;
    });
  }

  function addMetric(m: string, setter: (fn: (prev: string[]) => string[]) => void, max: number) {
    setter(prev => prev.includes(m) ? prev.filter(x => x !== m) : prev.length < max ? [...prev, m] : prev);
  }

  const singleMetric = teamMetrics.length === 1 ? teamMetrics[0]! : "overall";

  return (
    <div className="space-y-4">
      <ToggleGroup type="single" value={mode} onValueChange={v => { if (v) setMode(v as typeof mode); }}>
        <ToggleGroupItem value="teams">Teams</ToggleGroupItem>
        <ToggleGroupItem value="players">Players</ToggleGroupItem>
      </ToggleGroup>

      {mode === "teams" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-1 pt-3 px-4"><p className="text-xs font-semibold">Teams</p></CardHeader>
              <CardContent className="px-4 pb-3 space-y-1.5">
                {TEAM_NAMES.map(name => (
                  <label key={name} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={selectedTeams.has(name)} onChange={() => toggleTeam(name)} className="accent-primary" />
                    <span className="text-xs truncate group-hover:text-foreground text-muted-foreground" style={{ color: TEAM_COLOR[name] }}>{name}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-4"><p className="text-xs font-semibold">Metrics (up to 5)</p></CardHeader>
              <CardContent className="px-4 pb-3">
                <Input placeholder="Filter metrics…" value={teamMetricInput} onChange={e => setTeamMetricInput(e.target.value)} className="h-7 text-xs mb-2" />
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {ALL_METRICS_GROUPED.map(({ group, options }) => {
                    const filtered = options.filter(m => m.includes(teamMetricInput.toLowerCase()));
                    if (!filtered.length) return null;
                    return (
                      <div key={group}>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50 mt-1.5 mb-0.5">{group}</p>
                        {filtered.map(m => (
                          <button key={m} onClick={() => addMetric(m, setTeamMetrics, 5)}
                            className={`w-full text-left text-[11px] px-2 py-1 rounded-sm ${teamMetrics.includes(m) ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                            {fmtMetric(m)}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="px-2 pt-4 pb-2">
                <ChartContainer config={{}} className="h-[350px] w-full">
                  {teamMetrics.length === 1 ? (
                    <BarChart data={teamsChartData as { name: string; value: number; color: string }[]} layout="vertical" margin={{ left: 8, right: 60, top: 4, bottom: 4 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 'auto']} tickFormatter={v => SKILL_METRICS.has(singleMetric) ? `${(v/1_000_000).toFixed(1)}M` : v.toLocaleString()} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                      <Tooltip content={({ active, payload }) => active && payload?.[0] ? (
                        <div className="rounded border border-border bg-card px-3 py-2 text-xs shadow">
                          <p>{fmtGained(payload[0].value as number, singleMetric)} — {fmtMetric(singleMetric)}</p>
                        </div>
                      ) : null} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {(teamsChartData as { color: string }[]).map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart data={teamsChartData} margin={{ left: 8, right: 16, top: 4, bottom: 40 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                      <YAxis domain={[0, 'auto']} tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}M` : v.toLocaleString()} tick={{ fontSize: 10 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Tooltip />
                      {teamMetrics.map((m, i) => (
                        <Bar key={m} dataKey={m} name={fmtMetric(m)} fill={TEAM_COLORS[i % TEAM_COLORS.length]} radius={[3, 3, 0, 0]} />
                      ))}
                    </BarChart>
                  )}
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {mode === "players" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-1 pt-3 px-4"><p className="text-xs font-semibold">Team Filter</p></CardHeader>
              <CardContent className="px-4 pb-3">
                <Select value={teamFilter} onValueChange={v => { setTeamFilter(v); setSelectedPlayers(new Set()); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Teams</SelectItem>
                    {TEAM_NAMES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-4"><p className="text-xs font-semibold">Players (up to 8)</p></CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="max-h-52 overflow-y-auto space-y-0.5">
                  {availablePlayers.map(p => (
                    <label key={p.rsn} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={selectedPlayers.has(p.rsn)} onChange={() => togglePlayer(p.rsn)} className="accent-primary" />
                      <span className="text-xs truncate" style={{ color: p.teamColor }}>{p.rsn}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-4"><p className="text-xs font-semibold">Metrics (up to 5)</p></CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="max-h-44 overflow-y-auto space-y-0.5">
                  {ALL_METRICS_GROUPED.map(({ group, options }) => (
                    <div key={group}>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50 mt-1.5 mb-0.5">{group}</p>
                      {options.map(m => (
                        <button key={m} onClick={() => addMetric(m, setPlayerMetrics, 5)}
                          className={`w-full text-left text-[11px] px-2 py-1 rounded-sm ${playerMetrics.includes(m) ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                          {fmtMetric(m)}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {selectedPlayers.size === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Select players to compare</div>
            ) : (
              <Card>
                <CardContent className="px-2 pt-4 pb-2">
                  <div style={{ height: Math.max(300, selectedPlayers.size * 40) }}>
                    <ChartContainer config={{}} className="h-full w-full">
                      {playerMetrics.length === 1 ? (
                        <BarChart data={playersChartData as { name: string; gained: number; color: string }[]} layout="vertical" margin={{ left: 8, right: 60, top: 4, bottom: 4 }}>
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 'auto']} tickFormatter={v => SKILL_METRICS.has(playerMetrics[0]!) ? `${(v/1_000_000).toFixed(1)}M` : v.toLocaleString()} tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                          <Tooltip />
                          <Bar dataKey="gained" name={fmtMetric(playerMetrics[0]!)} radius={[0, 4, 4, 0]}>
                            {(playersChartData as { color: string }[]).map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Bar>
                        </BarChart>
                      ) : (
                        <BarChart data={playersChartData} margin={{ left: 8, right: 16, top: 4, bottom: 40 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                          <YAxis domain={[0, 'auto']} tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}M` : v.toLocaleString()} tick={{ fontSize: 10 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Tooltip />
                          {playerMetrics.map((m, i) => (
                            <Bar key={m} dataKey={m} name={fmtMetric(m)} fill={TEAM_COLORS[i % TEAM_COLORS.length]} radius={[3, 3, 0, 0]} />
                          ))}
                        </BarChart>
                      )}
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Submissions Tab
// ---------------------------------------------------------------------------

type SortCol = "submitted_at" | "rsn" | "teamName" | "tile_key" | "item_label";

interface FlatSub {
  submitted_at: string;
  rsn: string;
  teamName: string;
  teamColor: string;
  tile_key: string;
  item_label: string | null;
}

const ALL_SUBS: FlatSub[] = ALL_PLAYERS.flatMap(p =>
  p.submissions.map(s => ({ ...s, rsn: p.rsn, teamName: p.teamName, teamColor: p.teamColor }))
).sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));

function SubmissionsTab() {
  const [teamFilter, setTeamFilter] = useState("__all__");
  const [playerFilter, setPlayerFilter] = useState("__all__");
  const [itemSearch, setItemSearch] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>("submitted_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filteredPlayers = useMemo(() =>
    teamFilter === "__all__" ? ALL_PLAYERS : ALL_PLAYERS.filter(p => p.teamName === teamFilter),
    [teamFilter]
  );

  const filtered = useMemo(() => {
    let rows = ALL_SUBS;
    if (teamFilter !== "__all__") rows = rows.filter(r => r.teamName === teamFilter);
    if (playerFilter !== "__all__") rows = rows.filter(r => r.rsn === playerFilter);
    if (itemSearch.trim()) rows = rows.filter(r => r.item_label?.toLowerCase().includes(itemSearch.toLowerCase()));
    return [...rows].sort((a, b) => {
      const av = a[sortCol] ?? ""; const bv = b[sortCol] ?? "";
      return sortDir === "asc" ? av < bv ? -1 : 1 : av > bv ? -1 : 1;
    });
  }, [teamFilter, playerFilter, itemSearch, sortCol, sortDir]);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  const itemFreq = useMemo(() => {
    const f: Record<string, number> = {};
    for (const s of filtered) if (s.item_label) f[s.item_label] = (f[s.item_label] ?? 0) + 1;
    return Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [filtered]);

  const uniqueItems = new Set(ALL_SUBS.map(s => s.item_label).filter(Boolean)).size;
  const uniqueTiles = new Set(ALL_SUBS.map(s => s.tile_key)).size;

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 inline" /> : <ChevronDown className="h-3 w-3 inline" />;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{filtered.length}</strong> submissions</span>
        <span><strong className="text-foreground">{uniqueItems}</strong> unique items</span>
        <span><strong className="text-foreground">{uniqueTiles}</strong> unique tiles</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={teamFilter} onValueChange={v => { setTeamFilter(v); setPlayerFilter("__all__"); }}>
          <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="All teams" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Teams</SelectItem>
            {TEAM_NAMES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={playerFilter} onValueChange={setPlayerFilter}>
          <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="All players" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Players</SelectItem>
            {filteredPlayers.map(p => <SelectItem key={p.rsn} value={p.rsn}>{p.rsn}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Search item…" value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="h-8 text-xs w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Item frequency chart */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4"><p className="text-xs font-semibold">Top Submitted Items</p></CardHeader>
          <CardContent className="px-2 pb-2">
            <div style={{ height: Math.max(200, itemFreq.length * 22) }}>
              <ChartContainer config={{}} className="h-full w-full">
                <BarChart data={itemFreq.map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 19) + "…" : name, count }))} layout="vertical" margin={{ left: 4, right: 30, top: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-[7rem_6rem_7rem_4rem_1fr] gap-x-2 px-3 py-2 text-[10px] font-medium text-muted-foreground border-b border-border">
                {(["submitted_at", "rsn", "teamName", "tile_key", "item_label"] as SortCol[]).map((col, i) => (
                  <button key={col} className="text-left hover:text-foreground transition-colors" onClick={() => toggleSort(col)}>
                    {["Time", "Player", "Team", "Tile", "Item"][i]} <SortIcon col={col} />
                  </button>
                ))}
              </div>
              <div className="overflow-y-auto max-h-[520px]">
                {filtered.slice(0, 500).map((s, i) => (
                  <div key={i} className="grid grid-cols-[7rem_6rem_7rem_4rem_1fr] gap-x-2 px-3 py-1.5 text-xs border-b border-border/30 hover:bg-muted/30 items-center">
                    <span className="text-muted-foreground text-[10px] font-mono">{fmtDate(s.submitted_at)}</span>
                    <span className="truncate font-medium">{s.rsn}</span>
                    <span className="truncate text-[10px]" style={{ color: s.teamColor }}>{s.teamName.split(" ")[0]}</span>
                    <Badge variant="outline" className="text-[9px] w-fit">{s.tile_key}</Badge>
                    <span className="truncate text-muted-foreground">{s.item_label ?? "—"}</span>
                  </div>
                ))}
                {filtered.length > 500 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                    Showing 500 of {filtered.length} — narrow filters to see more
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

type Tab = "overview" | "leaderboards" | "compare" | "submissions";

export default function BingoPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="font-rs-bold text-4xl text-primary">Bingo Dashboard</h1>
            <Badge variant="outline" className="text-[10px] ml-1">Temp</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            8 teams · 97 players · {ALL_SUBS.length.toLocaleString()} submissions · {ACTIVE_METRICS.length} active metrics
          </p>
        </div>
        <p className="text-xs text-muted-foreground self-end">
          Data: {new Date(data.generated_at).toLocaleDateString()}
        </p>
      </div>

      <ToggleGroup type="single" variant="outline" value={tab} onValueChange={v => { if (v) setTab(v as Tab); }}>
        <ToggleGroupItem value="overview">Overview</ToggleGroupItem>
        <ToggleGroupItem value="leaderboards">Leaderboards</ToggleGroupItem>
        <ToggleGroupItem value="compare">Compare</ToggleGroupItem>
        <ToggleGroupItem value="submissions">Submissions</ToggleGroupItem>
      </ToggleGroup>

      {tab === "overview"     && <OverviewTab />}
      {tab === "leaderboards" && <LeaderboardTab />}
      {tab === "compare"      && <CompareTab />}
      {tab === "submissions"  && <SubmissionsTab />}
    </div>
  );
}
