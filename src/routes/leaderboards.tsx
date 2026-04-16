import { useEffect, useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const leaderboardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboards",
  component: LeaderboardsPage,
});

// ── Types ────────────────────────────────────────────────────────────────────

interface PbEntry {
  player_name: string;
  activity: string;
  variant: string;
  time_seconds: number; // float seconds e.g. 83.45
}

interface ClogEntry {
  player_name: string;
  slots: number;
  slots_max: number;
}

interface KcEntry {
  player_name: string;
  kills: number;
}

interface KcBoss {
  metric: string;
  display_name: string;
  entries: KcEntry[];
}

type Tab = "pb" | "clog" | "kc";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const wholeSec = Math.floor(s % 60);
  const cs = Math.round((s % 1) * 100);
  const secStr = `${String(wholeSec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${secStr}`;
  return `${m}:${secStr}`;
}

function rankLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

type Grouped = Record<string, Record<string, PbEntry[]>>;

function groupPbs(entries: PbEntry[]): Grouped {
  const out: Grouped = {};
  for (const e of entries) {
    const key = e.variant || "";
    const byVariant = (out[e.activity] ??= {});
    (byVariant[key] ??= []).push(e);
  }
  return out;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function RankRow({ rank, name, value }: { rank: number; name: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 items-center border-b border-border py-1.5 last:border-0 hover:bg-muted/40 rounded-sm">
      <span className="text-xs text-muted-foreground">{rankLabel(rank)}</span>
      <span className="font-medium text-foreground truncate">{name}</span>
      {value}
    </div>
  );
}

function RankHeader({ valueLabel }: { valueLabel: string }) {
  return (
    <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 border-b border-border pb-1 text-xs text-muted-foreground">
      <span>Rank</span>
      <span>Player</span>
      <span>{valueLabel}</span>
    </div>
  );
}

function PbTab({ entries, loading }: { entries: PbEntry[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const grouped = groupPbs(entries);
  const activities = Object.keys(grouped).sort();

  if (activities.length === 0)
    return <p className="text-sm text-muted-foreground">No times recorded yet.</p>;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {activities.map((activity) => {
        const variantMap = grouped[activity]!;
        const variants = Object.keys(variantMap).sort();
        return (
          <Card key={activity}>
            <CardHeader className="pb-2">
              <h2 className="font-rs-bold text-xl text-primary">{activity}</h2>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {variants.map((variant) => {
                const rows = variantMap[variant]!;
                return (
                  <div key={variant} className="space-y-1">
                    {variant && (
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {variant}
                      </p>
                    )}
                    <div className="w-full text-sm">
                      <RankHeader valueLabel="Time" />
                      {rows.map((entry, i) => (
                        <RankRow
                          key={entry.player_name}
                          rank={i + 1}
                          name={entry.player_name}
                          value={
                            <Badge variant="secondary" className="font-rs-bold text-xs tabular-nums">
                              {formatTime(entry.time_seconds)}
                            </Badge>
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function KcTab({ bosses, loading }: { bosses: KcBoss[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (bosses.length === 0)
    return <p className="text-sm text-muted-foreground">No killcount data yet.</p>;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {bosses.map((boss) => (
        <Card key={boss.metric}>
          <CardHeader className="pb-2">
            <h2 className="font-rs-bold text-xl text-primary">{boss.display_name}</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full text-sm">
              <RankHeader valueLabel="KC" />
              {boss.entries.map((entry, i) => (
                <RankRow
                  key={entry.player_name}
                  rank={i + 1}
                  name={entry.player_name}
                  value={
                    <Badge variant="secondary" className="font-rs-bold text-xs tabular-nums">
                      {entry.kills.toLocaleString()}
                    </Badge>
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ClogTab({ entries, loading }: { entries: ClogEntry[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (entries.length === 0)
    return <p className="text-sm text-muted-foreground">No collection log data yet.</p>;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="w-full text-sm">
          <RankHeader valueLabel="Slots" />
          {entries.map((entry, i) => (
            <RankRow
              key={entry.player_name}
              rank={i + 1}
              name={entry.player_name}
              value={
                <Badge variant="secondary" className="font-rs-bold text-xs tabular-nums">
                  {entry.slots.toLocaleString()}
                  {entry.slots_max > 0 && (
                    <span className="ml-1 text-muted-foreground font-normal">
                      / {entry.slots_max.toLocaleString()}
                    </span>
                  )}
                </Badge>
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function LeaderboardsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("pb");

  const [pbEntries, setPbEntries] = useState<PbEntry[]>([]);
  const [pbLoading, setPbLoading] = useState(true);

  const [clogEntries, setClogEntries] = useState<ClogEntry[]>([]);
  const [clogLoading, setClogLoading] = useState(true);

  const [kcBosses, setKcBosses] = useState<KcBoss[]>([]);
  const [kcLoading, setKcLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const token = getAuthToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_URL}/clan/leaderboards`, { headers })
      .then((r) => (r.ok ? (r.json() as Promise<PbEntry[]>) : Promise.reject()))
      .then(setPbEntries)
      .catch(() => {})
      .finally(() => setPbLoading(false));

    fetch(`${API_URL}/clan/leaderboards/collection-log`, { headers })
      .then((r) => (r.ok ? (r.json() as Promise<ClogEntry[]>) : Promise.reject()))
      .then(setClogEntries)
      .catch(() => {})
      .finally(() => setClogLoading(false));

    fetch(`${API_URL}/clan/leaderboards/killcounts`, { headers })
      .then((r) => (r.ok ? (r.json() as Promise<KcBoss[]>) : Promise.reject()))
      .then(setKcBosses)
      .catch(() => {})
      .finally(() => setKcLoading(false));
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Leaderboards</h1>
      </div>

      <div className="flex items-center gap-4">
        <ToggleGroup
          type="single"
          variant="outline"
          value={tab}
          onValueChange={(v) => { if (v) setTab(v as Tab); }}
        >
          <ToggleGroupItem value="pb">Personal Bests</ToggleGroupItem>
          <ToggleGroupItem value="clog">Collection Log</ToggleGroupItem>
          <ToggleGroupItem value="kc">Killcounts</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator />

      {tab === "pb" && <PbTab entries={pbEntries} loading={pbLoading} />}
      {tab === "clog" && <ClogTab entries={clogEntries} loading={clogLoading} />}
      {tab === "kc" && <KcTab bosses={kcBosses} loading={kcLoading} />}
    </div>
  );
}
