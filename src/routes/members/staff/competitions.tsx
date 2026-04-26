import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { cacheInvalidate, fetchCached } from "@/lib/cache";
import { registerPage } from "@/lib/permissions";
import { StaffGuard } from "@/components/StaffGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

registerPage({
  id: "staff.competitions",
  label: "Staff - Competitions",
  description: "Configure which metrics are tracked per competition.",
  defaults: {
    read: ["Senior Moderator"],
    create: ["Senior Moderator"],
    edit: ["Senior Moderator"],
    delete: ["Senior Moderator"],
  },
});

export const staffCompetitionsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/competitions",
  component: () => (
    <StaffGuard pageId="staff.competitions">
      <StaffCompetitionsPage />
    </StaffGuard>
  ),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Competition {
  id: number;
  title: string;
  metric: string;
  type: string;
  status: "upcoming" | "ongoing" | "finished";
}

type MetricMap = Record<string, string[]>;

// ---------------------------------------------------------------------------
// Metric groups
// ---------------------------------------------------------------------------

const METRIC_GROUPS: Record<string, string[]> = {
  Skills: [
    "overall", "attack", "defence", "strength", "hitpoints", "ranged", "prayer",
    "magic", "cooking", "woodcutting", "fletching", "fishing", "firemaking",
    "crafting", "smithing", "mining", "herblore", "agility", "thieving", "slayer",
    "farming", "runecrafting", "hunter", "construction",
  ],
  Bosses: [
    "abyssal_sire", "alchemical_hydra", "cerberus", "chambers_of_xeric",
    "chambers_of_xeric_challenge_mode", "corporeal_beast", "grotesque_guardians",
    "kalphite_queen", "king_black_dragon", "kraken", "nex", "the_nightmare",
    "phosanis_nightmare", "theatre_of_blood", "theatre_of_blood_hard_mode",
    "tombs_of_amascut", "tombs_of_amascut_expert_mode", "vorkath", "zulrah",
  ],
  Activities: [
    "clue_scrolls_all", "clue_scrolls_easy", "clue_scrolls_medium",
    "clue_scrolls_hard", "clue_scrolls_elite", "clue_scrolls_master",
    "league_points", "last_man_standing", "bounty_hunter_hunter",
  ],
};

function fmtLabel(metric: string): string {
  return metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function StaffCompetitionsPage() {
  const { user } = useAuth();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [metricMap, setMetricMap] = useState<MetricMap>({});
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  function handleCompSelect(id: string) {
    setSelectedId(id);
    setPending(metricMap[id] ?? []);
    setSaved(false);
  }

  function toggleMetric(metric: string) {
    setPending((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric],
    );
    setSaved(false);
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/clan/competitions/metric-map`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ competition_id: parseInt(selectedId), metrics: pending }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: MetricMap = await res.json();
      setMetricMap(updated);
      cacheInvalidate("competitions:metric-map");
      setSaved(true);
    } catch {
      // keep current state on error
    } finally {
      setSaving(false);
    }
  }

  const grouped = {
    ongoing: competitions.filter((c) => c.status === "ongoing"),
    upcoming: competitions.filter((c) => c.status === "upcoming"),
    finished: competitions.filter((c) => c.status === "finished"),
  };

  const filterLower = filter.toLowerCase();
  const filteredGroups = Object.entries(METRIC_GROUPS).map(([group, metrics]) => ({
    group,
    metrics: filter
      ? metrics.filter((m) => m.includes(filterLower) || fmtLabel(m).toLowerCase().includes(filterLower))
      : metrics,
  })).filter(({ metrics }) => metrics.length > 0);

  return (
    <div className="mx-auto max-w-4xl w-full space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Competition Metrics</h1>
        <p className="text-sm text-muted-foreground">
          Map additional WOM metrics to each competition for display on the Competitions page.
        </p>
      </div>

      {/* Competition selector */}
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <p className="text-sm font-medium">Select Competition</p>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <Select value={selectedId} onValueChange={handleCompSelect} disabled={loading}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder={loading ? "Loading..." : "Choose a competition"} />
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
        </CardContent>
      </Card>

      {/* Metric configurator */}
      {selectedId && (
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Tracked Metrics</p>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : saved ? "Saved" : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Current metrics chips */}
            {pending.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {pending.map((m) => (
                  <Badge
                    key={m}
                    variant="secondary"
                    className="gap-1.5 cursor-pointer hover:bg-destructive/20 transition-colors"
                    onClick={() => toggleMetric(m)}
                  >
                    {fmtLabel(m)}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No metrics selected. Pick from the list below.
              </p>
            )}

            <Separator />

            {/* Filter input */}
            <Input
              placeholder="Filter metrics..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 text-sm"
            />

            {/* Grouped checklist */}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {filteredGroups.map(({ group, metrics }) => (
                <div key={group}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">{group}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {metrics.map((m) => {
                      const checked = pending.includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => toggleMetric(m)}
                          className={`text-left text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                            checked
                              ? "bg-primary/15 border-primary/40 text-primary font-medium"
                              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {fmtLabel(m)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
