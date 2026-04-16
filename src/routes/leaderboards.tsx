import { useEffect, useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const leaderboardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboards",
  component: LeaderboardsPage,
});

interface LeaderboardEntry {
  player_name: string;
  activity: string;
  variant: string;
  time_seconds: number; // float seconds, e.g. 83.45
}

/** Format float seconds → M:SS.ss or H:MM:SS.ss */
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

type Grouped = Record<string, Record<string, LeaderboardEntry[]>>;

function groupEntries(entries: LeaderboardEntry[]): Grouped {
  const out: Grouped = {};
  for (const e of entries) {
    const key = e.variant || "";
    const byVariant = (out[e.activity] ??= {});
    (byVariant[key] ??= []).push(e);
  }
  return out;
}

function LeaderboardsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const token = getAuthToken();
    fetch(`${API_URL}/clan/leaderboards`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? (r.json() as Promise<LeaderboardEntry[]>) : Promise.reject()))
      .then(setEntries)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) return null;
  if (!user) return null;

  const grouped = groupEntries(entries);
  const activities = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-7xl space-y-8 py-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Personal Bests</h1>
        <p className="text-sm text-muted-foreground">
          Fastest recorded times per activity across all clan members.
        </p>
      </div>

      <Separator />

      {fetching ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No times recorded yet.</p>
      ) : (
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
                          {/* Header */}
                          <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 border-b border-border pb-1 text-xs text-muted-foreground">
                            <span>Rank</span>
                            <span>Player</span>
                            <span>Time</span>
                          </div>
                          {/* Rows */}
                          {rows.map((entry, i) => (
                            <div
                              key={entry.player_name}
                              className="grid grid-cols-[2rem_1fr_auto] gap-x-4 items-center border-b border-border py-1.5 last:border-0 hover:bg-muted/40 rounded-sm"
                            >
                              <span className="text-xs text-muted-foreground">{rankLabel(i + 1)}</span>
                              <span className="font-medium text-foreground truncate">{entry.player_name}</span>
                              <Badge variant="secondary" className="font-rs-bold text-xs tabular-nums">
                                {formatTime(entry.time_seconds)}
                              </Badge>
                            </div>
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
      )}
    </div>
  );
}
