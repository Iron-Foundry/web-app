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
  time_seconds: number;
}

/** Format integer seconds → M:SS or H:MM:SS */
function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
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
    (out[e.activity] ??= {})[e.variant || ""] ??= [];
    out[e.activity][e.variant || ""].push(e);
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
    <div className="mx-auto max-w-5xl space-y-8 py-6">
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
        <div className="space-y-6">
          {activities.map((activity) => {
            const variantMap = grouped[activity];
            const variants = Object.keys(variantMap).sort();
            return (
              <Card key={activity}>
                <CardHeader className="pb-2">
                  <h2 className="font-rs-bold text-xl text-primary">{activity}</h2>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {variants.map((variant) => {
                    const rows = variantMap[variant];
                    return (
                      <div key={variant} className="space-y-1">
                        {variant && (
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {variant}
                          </p>
                        )}
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs text-muted-foreground">
                              <th className="pb-1 pr-4 font-medium w-12">Rank</th>
                              <th className="pb-1 pr-4 font-medium">Player</th>
                              <th className="pb-1 font-medium text-right">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {rows.map((entry, i) => (
                              <tr key={entry.player_name} className="hover:bg-muted/40">
                                <td className="py-1.5 pr-4 text-muted-foreground text-xs w-12">
                                  {rankLabel(i + 1)}
                                </td>
                                <td className="py-1.5 pr-4 font-medium text-foreground">
                                  {entry.player_name}
                                </td>
                                <td className="py-1.5 text-right">
                                  <Badge variant="secondary" className="font-rs-bold text-xs tabular-nums">
                                    {formatTime(entry.time_seconds)}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
