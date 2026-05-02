import { useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { registerPage } from "@/lib/permissions";
import { LeaderboardSkeleton } from "@/components/skeletons/LeaderboardSkeleton";
import {
  usePbLeaderboard,
  useClogLeaderboard,
  useKillcountLeaderboard,
  useLeagueLeaderboard,
} from "@/hooks/useLeaderboards";
import type { PbEntry, ClogEntry, KcBoss, LeaguesEntry, LeaderboardTab } from "@/types/leaderboard";

registerPage({
  id: "leaderboards",
  label: "Leaderboards",
  description: "Clan skill and activity leaderboards.",
  defaults: { read: [], create: ["Senior Moderator"], edit: ["Senior Moderator"], delete: ["Senior Moderator"] },
});

export const leaderboardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboards",
  component: LeaderboardsPage,
});

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

function PbLeaderboardTab() {
  const { data: entries = [], isLoading } = usePbLeaderboard();
  if (isLoading) return <LeaderboardSkeleton />;
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

function KcLeaderboardTab() {
  const { data: bosses = [], isLoading } = useKillcountLeaderboard();
  if (isLoading) return <LeaderboardSkeleton />;
  if (bosses.length === 0)
    return <p className="text-sm text-muted-foreground">No killcount data yet.</p>;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {bosses.map((boss: KcBoss) => (
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

function LeaguesLeaderboardTab() {
  const { data: entries = [], isLoading } = useLeagueLeaderboard();
  if (isLoading) return <LeaderboardSkeleton />;
  if (entries.length === 0)
    return <p className="text-sm text-muted-foreground">No cluescroll data yet.</p>;
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="w-full text-sm">
          <RankHeader valueLabel="Clues" />
          {(entries as LeaguesEntry[]).map((entry, i) => (
            <RankRow
              key={entry.player_name}
              rank={i + 1}
              name={entry.player_name}
              value={
                <Badge variant="secondary" className="font-rs-bold text-xs tabular-nums">
                  {entry.score.toLocaleString()}
                </Badge>
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ClogLeaderboardTab() {
  const { data: entries = [], isLoading } = useClogLeaderboard();
  if (isLoading) return <LeaderboardSkeleton />;
  if (entries.length === 0)
    return <p className="text-sm text-muted-foreground">No collection log data yet.</p>;
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="w-full text-sm">
          <RankHeader valueLabel="Slots" />
          {(entries as ClogEntry[]).map((entry, i) => (
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

function LeaderboardsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<LeaderboardTab>("pb");

  if (loading) return <LeaderboardSkeleton />;
  if (!user) {
    void navigate({ to: "/login" });
    return null;
  }

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
          onValueChange={(v) => { if (v) setTab(v as LeaderboardTab); }}
        >
          <ToggleGroupItem value="pb">Personal Bests</ToggleGroupItem>
          <ToggleGroupItem value="clog">Collection Logs</ToggleGroupItem>
          <ToggleGroupItem value="kc">Killcounts</ToggleGroupItem>
          <ToggleGroupItem value="leagues">Cluescrolls</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator />

      {tab === "pb" && <PbLeaderboardTab />}
      {tab === "clog" && <ClogLeaderboardTab />}
      {tab === "kc" && <KcLeaderboardTab />}
      {tab === "leagues" && <LeaguesLeaderboardTab />}
    </div>
  );
}
