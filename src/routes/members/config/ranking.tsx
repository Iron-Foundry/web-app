import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Tabs } from "radix-ui";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { StaffGuard } from "@/components/StaffGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerPage } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { BarChart2, RefreshCw, TrendingUp, TrendingDown, Minus, X } from "lucide-react";

registerPage({
  id: "staff.ranking",
  label: "Ranking",
  description: "Daily WOM-based clan member ranking by boss KC and skill XP.",
  defaults: { read: ["Foundry Mentors"], create: ["Senior Moderator"], edit: ["Senior Moderator"], delete: [] },
});

export const configRankingRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/config/ranking",
  component: () => <StaffGuard pageId="staff.ranking" redirectTo="/members"><RankingPage /></StaffGuard>,
});

// ── Config types (v2 format) ──────────────────────────────────────────────────

interface BossMetricConfig {
  name: string;
  points_per_kc: number;
  first_kill_bonus: number;
  tier_weight: number;
  log_scale: boolean;
}

interface SkillMetricConfig {
  name: string;
  points_per_million_xp: number;
  milestone_99_bonus: number;
  milestone_200m_bonus: number;
  log_scale: boolean;
}

interface PrestigeMetricConfig {
  boss_name: string;
  multiplier: number;
}

interface RankingConfig {
  version: 2;
  bosses: BossMetricConfig[];
  skills: SkillMetricConfig[];
  prestige: PrestigeMetricConfig[];
  rank_thresholds: Record<string, number>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const tabTrigger = cn(
  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
  "text-muted-foreground border-transparent hover:text-foreground",
  "data-[state=active]:text-foreground data-[state=active]:border-primary",
);

const RANK_ORDER: Record<string, number> = Object.fromEntries([
  ["No Rank", 0],
  ...Array.from({ length: 10 }, (_, i) => [`Rank ${i + 1}`, i + 1]),
]);

const RANK_COLORS: Record<number, string> = {
  1:  "text-muted-foreground",
  2:  "text-green-600",
  3:  "text-teal-500",
  4:  "text-blue-500",
  5:  "text-indigo-500",
  6:  "text-violet-500",
  7:  "text-purple-500",
  8:  "text-orange-500",
  9:  "text-amber-500 font-semibold",
  10: "text-yellow-500 font-semibold",
};

function rankColor(rank: string | null) {
  if (!rank || rank === "No Rank") return "text-muted-foreground";
  const n = parseInt(rank.replace("Rank ", ""), 10);
  return RANK_COLORS[n] ?? "text-yellow-500 font-semibold";
}

function fmt(n: number | null | undefined) {
  if (n == null) return "-";
  return n.toLocaleString();
}

// ── Number field helper ────────────────────────────────────────────────────────

function NumField({ label, value, onChange, step = 1, isFloat }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; isFloat?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        type="number"
        step={isFloat ? "0.1" : step}
        value={value}
        onChange={(e) => {
          const v = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(v);
        }}
        className="h-8 text-sm"
      />
    </label>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">{title}</h3>
      {children}
    </div>
  );
}

// ── Status card ────────────────────────────────────────────────────────────────

interface StatusInfo {
  last_run_at: string | null;
  player_count: number;
  last_error: string | null;
  service_active: boolean;
  is_running: boolean;
}

function StatusCard() {
  const [status, setStatus] = useState<StatusInfo | null>(null);

  function fetchStatus() {
    return fetch(`${API_URL}/ranking/status`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  // Poll every 3s while a run is in progress
  useEffect(() => {
    if (!status?.is_running) return;
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, [status?.is_running]);

  async function triggerRun() {
    await fetch(`${API_URL}/ranking/run`, { method: "POST", headers: getAuthHeaders() });
    await fetchStatus();
  }

  const running = status?.is_running ?? false;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-6 text-sm">
        <span className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Players ranked:</span>
          <span className="font-medium">{status?.player_count ?? "-"}</span>
        </span>
        <span className="text-muted-foreground">
          Last run:{" "}
          <span className="text-foreground">
            {status?.last_run_at ? new Date(status.last_run_at).toLocaleString() : "Never"}
          </span>
        </span>
        {running && (
          <span className="text-xs text-muted-foreground animate-pulse">Ranking in progress…</span>
        )}
        {!running && status?.last_error && (
          <span className="text-destructive text-xs break-all">Error: {status.last_error}</span>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={triggerRun} disabled={running} className="gap-2">
        <RefreshCw className={cn("h-3.5 w-3.5", running && "animate-spin")} />
        {running ? "Running…" : "Run Now"}
      </Button>
    </div>
  );
}

// ── Results tab ────────────────────────────────────────────────────────────────

interface PlayerResult {
  rsn: string;
  rank: string;
  points: number;
  boss_points: number;
  skill_points: number;
  discord_user_id: number | null;
  username: string | null;
  updated_at: string;
}

interface ResultsData {
  players: PlayerResult[];
  total: number;
  breakdown: {
    avg_boss_pct: number;
    avg_skill_pct: number;
    rank_distribution: Record<string, number>;
  };
}

const ALL_RANKS = ["Rank 6", "Rank 5", "Rank 4", "Rank 3", "Rank 2", "Rank 1", "No Rank"];

function ResultsTab() {
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      skip: String(page * pageSize),
      limit: String(pageSize),
    });
    if (rankFilter) params.set("rank_filter", rankFilter);
    fetch(`${API_URL}/ranking/results?${params}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [page, rankFilter]);

  const breakdown = data?.breakdown;

  return (
    <div className="space-y-4">
      {breakdown && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">PvM contribution</p>
            <p className="text-2xl font-bold text-foreground">{breakdown.avg_boss_pct}%</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Skills contribution</p>
            <p className="text-2xl font-bold text-foreground">{breakdown.avg_skill_pct}%</p>
          </div>
          {["Rank 6", "Rank 5"].map((r) => (
            <div key={r} className="rounded-lg border border-border bg-card p-3 text-center">
              <p className={cn("text-xs mb-1", rankColor(r))}>{r}</p>
              <p className="text-2xl font-bold">{breakdown.rank_distribution[r] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {breakdown && (
        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
          {ALL_RANKS.map((r) => {
            const count = breakdown.rank_distribution[r] ?? 0;
            const pct = data ? (count / data.total) * 100 : 0;
            const colors: Record<string, string> = {
              "Rank 6": "bg-yellow-500", "Rank 5": "bg-amber-500", "Rank 4": "bg-orange-500",
              "Rank 3": "bg-blue-500", "Rank 2": "bg-green-500", "Rank 1": "bg-muted-foreground",
              "No Rank": "bg-muted",
            };
            return <div key={r} className={cn("transition-all", colors[r])} style={{ width: `${pct}%` }} title={`${r}: ${count}`} />;
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setRankFilter(null); setPage(0); }}
          className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors border",
            !rankFilter ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")}
        >
          All ({data?.total ?? 0})
        </button>
        {ALL_RANKS.map((r) => (
          <button
            key={r}
            onClick={() => { setRankFilter(r); setPage(0); }}
            className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors border",
              rankFilter === r ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")}
          >
            {r} ({breakdown?.rank_distribution[r] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">RSN</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Rank</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Points</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">PvM pts</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Skill pts</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Discord</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.players ?? []).map((p, i) => {
                const totalPts = p.boss_points + p.skill_points;
                const bossPct = totalPts > 0 ? Math.round(p.boss_points / totalPts * 100) : 0;
                return (
                  <tr key={p.rsn} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{page * pageSize + i + 1}</td>
                    <td className="px-3 py-2 font-mono font-medium">{p.rsn}</td>
                    <td className={cn("px-3 py-2", rankColor(p.rank))}>{p.rank}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(p.points)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground text-xs">
                      {fmt(p.boss_points)}
                      <span className="ml-1 text-muted-foreground/60">({bossPct}%)</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground text-xs">
                      {fmt(p.skill_points)}
                      <span className="ml-1 text-muted-foreground/60">({100 - bossPct}%)</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{p.username ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > pageSize && (
        <div className="flex items-center gap-2 justify-center text-sm">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </Button>
          <span className="text-muted-foreground">
            Page {page + 1} of {Math.ceil(data.total / pageSize)}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * pageSize >= data.total}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Config tab ─────────────────────────────────────────────────────────────────

interface PreviewPlayer {
  rsn: string;
  current_rank: string | null;
  current_points: number | null;
  preview_rank: string;
  preview_points: number;
  boss_points: number;
  skill_points: number;
  rank_changed: boolean;
  points_delta: number | null;
}

interface PreviewData {
  players: PreviewPlayer[];
  breakdown: {
    avg_boss_pct: number;
    avg_skill_pct: number;
    rank_distribution: Record<string, number>;
    promotions: number;
    demotions: number;
    unchanged: number;
  };
}

function ConfigTab() {
  const [config, setConfig] = useState<RankingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/config/ranking`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data: RankingConfig) => setConfig(data))
      .catch(() => setError("Failed to load ranking config."))
      .finally(() => setLoading(false));
  }, []);

  function markDirty() {
    setSaved(false);
    setPreview(null);
  }

  function updateThreshold(key: string, val: number) {
    setConfig((prev) => prev ? { ...prev, rank_thresholds: { ...prev.rank_thresholds, [key]: val } } : prev);
    markDirty();
  }

  function addRank() {
    setConfig((prev) => {
      if (!prev) return prev;
      const nums = Object.keys(prev.rank_thresholds)
        .map((k) => parseInt(k.replace("rank_", ""), 10))
        .filter((n) => !isNaN(n));
      const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      return { ...prev, rank_thresholds: { ...prev.rank_thresholds, [`rank_${next}`]: 0 } };
    });
    markDirty();
  }

  function removeRank(key: string) {
    setConfig((prev) => {
      if (!prev) return prev;
      const { [key]: _removed, ...rest } = prev.rank_thresholds;
      return { ...prev, rank_thresholds: rest };
    });
    markDirty();
  }

  function updateBoss(index: number, field: keyof BossMetricConfig, val: number | boolean) {
    setConfig((prev) => {
      if (!prev) return prev;
      const bosses = prev.bosses.map((b, i) => i === index ? { ...b, [field]: val } : b);
      return { ...prev, bosses };
    });
    markDirty();
  }

  function updateGroupTierWeight(indices: number[], newWeight: number) {
    setConfig((prev) => {
      if (!prev) return prev;
      const bosses = prev.bosses.map((b, i) =>
        indices.includes(i) ? { ...b, tier_weight: newWeight } : b,
      );
      return { ...prev, bosses };
    });
    markDirty();
  }

  function updateSkill(index: number, field: keyof SkillMetricConfig, val: number | boolean) {
    setConfig((prev) => {
      if (!prev) return prev;
      const skills = prev.skills.map((s, i) => i === index ? { ...s, [field]: val } : s);
      return { ...prev, skills };
    });
    markDirty();
  }

  function updatePrestige(index: number, field: keyof PrestigeMetricConfig, val: string | number) {
    setConfig((prev) => {
      if (!prev) return prev;
      const prestige = prev.prestige.map((p, i) => i === index ? { ...p, [field]: val } : p);
      return { ...prev, prestige };
    });
    markDirty();
  }

  function addPrestige() {
    setConfig((prev) => prev ? { ...prev, prestige: [...prev.prestige, { boss_name: "", multiplier: 1.1 }] } : prev);
    markDirty();
  }

  function removePrestige(index: number) {
    setConfig((prev) => prev ? { ...prev, prestige: prev.prestige.filter((_, i) => i !== index) } : prev);
    markDirty();
  }

  async function handlePreview() {
    if (!config) return;
    setPreviewing(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/ranking/preview`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null) as { detail?: string } | null;
        setError(d?.detail ?? "Preview failed.");
        return;
      }
      setPreview(await res.json() as PreviewData);
    } catch {
      setError("Network error.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/config/ranking`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null) as { detail?: string } | null;
        setError(d?.detail ?? "Save failed.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading config…</p>;
  if (!config) return <p className="text-sm text-destructive">{error ?? "Failed to load config."}</p>;

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-1 min-w-0 space-y-6">

        <Section title="Rank Thresholds (points)">
          <p className="text-xs text-muted-foreground">
            {Object.keys(config.rank_thresholds).length} rank{Object.keys(config.rank_thresholds).length !== 1 ? "s" : ""} configured (1-10 allowed).
            Sorted highest to lowest. Players with 0 points always receive No Rank.
          </p>
          <div className="space-y-2">
            {Object.entries(config.rank_thresholds)
              .sort(([, a], [, b]) => b - a)
              .map(([key, threshold]) => {
                const label = `Rank ${key.replace("rank_", "")}`;
                const canRemove = Object.keys(config.rank_thresholds).length > 1;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className={cn("w-16 shrink-0 text-sm font-medium", rankColor(label))}>{label}</span>
                    <div className="flex-1">
                      <NumField label="" value={threshold} step={1000} onChange={(v) => updateThreshold(key, v)} />
                    </div>
                    <button
                      onClick={() => removeRank(key)}
                      disabled={!canRemove}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-30 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addRank}
            disabled={Object.keys(config.rank_thresholds).length >= 10}
          >
            + Add Rank
          </Button>
        </Section>

        <Section title="Prestige Multipliers">
          <p className="text-xs text-muted-foreground">
            Completing these bosses (KC &ge; 1) multiplies the player&apos;s total score. Stacks multiplicatively.
          </p>
          <div className="space-y-2">
            {config.prestige.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={p.boss_name}
                  onChange={(e) => updatePrestige(i, "boss_name", e.target.value)}
                  placeholder="boss_name (WOM key)"
                  className="h-8 text-sm font-mono flex-1"
                />
                <div className="w-28 shrink-0">
                  <NumField label="" value={p.multiplier} isFloat step={0.01}
                    onChange={(v) => updatePrestige(i, "multiplier", v)} />
                </div>
                <button onClick={() => removePrestige(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addPrestige}>+ Add prestige boss</Button>
          </div>
        </Section>

        <Section title="Boss Metrics">
          <p className="text-xs text-muted-foreground">
            Score = first_kill_bonus + points_per_kc &times; tier_weight &times; (kc &minus; 1).
            Edit tier weight per row to move a boss between groups. Group headers bulk-update all bosses in that group.
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Boss</th>
                  <th className="px-2 py-1.5 text-center font-medium text-muted-foreground w-20">Pts/KC</th>
                  <th className="px-2 py-1.5 text-center font-medium text-muted-foreground w-24">First Kill Bonus</th>
                  <th className="px-2 py-1.5 text-center font-medium text-muted-foreground w-24">Tier Weight</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const groups = config.bosses.reduce<{ weight: number; entries: { boss: BossMetricConfig; index: number }[] }[]>(
                    (acc, boss, index) => {
                      const last = acc[acc.length - 1];
                      if (last && last.weight === boss.tier_weight) {
                        last.entries.push({ boss, index });
                      } else {
                        acc.push({ weight: boss.tier_weight, entries: [{ boss, index }] });
                      }
                      return acc;
                    },
                    [],
                  );
                  return groups.map((group) => {
                    const indices = group.entries.map((e) => e.index);
                    return (
                      <>
                        <tr key={`group-${group.entries[0].index}`} className="bg-muted/40 border-t-2 border-border">
                          <td colSpan={3} className="px-2 py-1 font-semibold text-muted-foreground">
                            Weight {group.weight} - {group.entries.length} boss{group.entries.length !== 1 ? "es" : ""}
                          </td>
                          <td className="px-1 py-0.5" title="Bulk-update tier weight for all bosses in this group">
                            <Input
                              type="number"
                              step="0.5"
                              value={group.weight}
                              className="h-6 text-xs text-center bg-muted"
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (!isNaN(v)) updateGroupTierWeight(indices, v);
                              }}
                            />
                          </td>
                        </tr>
                        {group.entries.map(({ boss, index }) => (
                          <tr key={boss.name} className="border-t border-border/40 hover:bg-muted/20">
                            <td className="px-2 py-1 font-mono text-foreground pl-5">{boss.name}</td>
                            <td className="px-1 py-0.5">
                              <Input type="number" step="0.5" value={boss.points_per_kc} className="h-6 text-xs text-center"
                                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateBoss(index, "points_per_kc", v); }} />
                            </td>
                            <td className="px-1 py-0.5">
                              <Input type="number" step="50" value={boss.first_kill_bonus} className="h-6 text-xs text-center"
                                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateBoss(index, "first_kill_bonus", v); }} />
                            </td>
                            <td className="px-1 py-0.5">
                              <Input type="number" step="0.5" value={boss.tier_weight} className="h-6 text-xs text-center"
                                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateBoss(index, "tier_weight", v); }} />
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Skill Metrics">
          <p className="text-xs text-muted-foreground">
            Score = (pts/M XP) &times; (XP / 1M) + 99 bonus (if XP &ge; 13,034,431) + 200M bonus (if XP &ge; 200,000,000)
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Skill</th>
                  <th className="px-2 py-1.5 text-center font-medium text-muted-foreground w-20">Pts/M XP</th>
                  <th className="px-2 py-1.5 text-center font-medium text-muted-foreground w-24">99 Bonus</th>
                  <th className="px-2 py-1.5 text-center font-medium text-muted-foreground w-24">200M Bonus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {config.skills.map((s, i) => (
                  <tr key={s.name} className="hover:bg-muted/20">
                    <td className="px-2 py-1 font-mono text-foreground">{s.name}</td>
                    <td className="px-1 py-0.5">
                      <Input type="number" step="0.5" value={s.points_per_million_xp} className="h-6 text-xs text-center"
                        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateSkill(i, "points_per_million_xp", v); }} />
                    </td>
                    <td className="px-1 py-0.5">
                      <Input type="number" step="50" value={s.milestone_99_bonus} className="h-6 text-xs text-center"
                        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateSkill(i, "milestone_99_bonus", v); }} />
                    </td>
                    <td className="px-1 py-0.5">
                      <Input type="number" step="100" value={s.milestone_200m_bonus} className="h-6 text-xs text-center"
                        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateSkill(i, "milestone_200m_bonus", v); }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-green-600">Config saved.</p>}

        <div className="flex gap-3">
          <Button onClick={handlePreview} disabled={previewing} variant="outline" className="gap-2">
            <BarChart2 className="h-4 w-4" />
            {previewing ? "Previewing…" : "Preview Changes"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Config"}
          </Button>
        </div>
      </div>

      {/* Right: preview panel */}
      {preview && (
        <div className="w-[480px] shrink-0 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">Preview Results</h3>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md bg-green-500/10 border border-green-500/20 p-2">
                <p className="text-green-600 font-semibold text-lg">{preview.breakdown.promotions}</p>
                <p className="text-muted-foreground">Promotions</p>
              </div>
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-2">
                <p className="text-red-600 font-semibold text-lg">{preview.breakdown.demotions}</p>
                <p className="text-muted-foreground">Demotions</p>
              </div>
              <div className="rounded-md bg-muted/50 border border-border p-2">
                <p className="font-semibold text-lg">{preview.breakdown.unchanged}</p>
                <p className="text-muted-foreground">Unchanged</p>
              </div>
            </div>

            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>PvM avg: <strong>{preview.breakdown.avg_boss_pct}%</strong></span>
              <span>Skills avg: <strong>{preview.breakdown.avg_skill_pct}%</strong></span>
            </div>

            <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
              {ALL_RANKS.map((r) => {
                const count = preview.breakdown.rank_distribution[r] ?? 0;
                const pct = preview.players.length > 0 ? (count / preview.players.length) * 100 : 0;
                const colors: Record<string, string> = {
                  "Rank 6": "bg-yellow-500", "Rank 5": "bg-amber-500", "Rank 4": "bg-orange-500",
                  "Rank 3": "bg-blue-500", "Rank 2": "bg-green-500", "Rank 1": "bg-muted-foreground",
                  "No Rank": "bg-muted",
                };
                return <div key={r} className={colors[r]} style={{ width: `${pct}%` }} title={`${r}: ${count}`} />;
              })}
            </div>
          </div>

          {/* Diff table - only changed rows */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 bg-muted/50 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rank Changes</p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">RSN</th>
                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Current → Preview</th>
                    <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">Δ Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.players
                    .filter((p) => p.rank_changed)
                    .map((p) => {
                      const dir = (RANK_ORDER[p.preview_rank] ?? 0) > (RANK_ORDER[p.current_rank ?? "No Rank"] ?? 0) ? 1 : -1;
                      return (
                        <tr key={p.rsn} className="hover:bg-muted/30">
                          <td className="px-3 py-1.5 font-mono">{p.rsn}</td>
                          <td className="px-3 py-1.5">
                            <span className={cn("flex items-center gap-1", dir > 0 ? "text-green-600" : "text-red-600")}>
                              {dir > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              <span className={rankColor(p.current_rank)}>{p.current_rank ?? "None"}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className={rankColor(p.preview_rank)}>{p.preview_rank}</span>
                            </span>
                          </td>
                          <td className={cn("px-3 py-1.5 text-right tabular-nums",
                            (p.points_delta ?? 0) > 0 ? "text-green-600" : (p.points_delta ?? 0) < 0 ? "text-red-600" : "")}>
                            {p.points_delta != null ? `${p.points_delta > 0 ? "+" : ""}${p.points_delta.toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {preview.players.filter((p) => p.rank_changed).length === 0 && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Minus className="h-4 w-4" /> No rank changes with this config.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function RankingPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ranking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Daily WOM-based clan ranking - boss KC and skill XP.
          </p>
        </div>
      </div>

      <StatusCard />

      <Tabs.Root defaultValue="results">
        <div className="border-b border-border">
          <Tabs.List className="flex -mb-px">
            <Tabs.Trigger value="results" className={tabTrigger}>Results</Tabs.Trigger>
            <Tabs.Trigger value="config" className={tabTrigger}>Config</Tabs.Trigger>
          </Tabs.List>
        </div>
        <Tabs.Content value="results" className="pt-4">
          <ResultsTab />
        </Tabs.Content>
        <Tabs.Content value="config" className="pt-4">
          <ConfigTab />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
