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

export const staffRankingRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/ranking",
  component: () => <StaffGuard pageId="staff.ranking"><RankingPage /></StaffGuard>,
});

// ── Default config (mirrors backend _DEFAULT_CONFIG) ─────────────────────────

const ALL_SKILLS = [
  "attack", "strength", "defense", "range", "magic", "prayer", "hitpoints",
  "slayer", "cooking", "woodcutting", "fletching", "fishing", "firemaking",
  "crafting", "smithing", "mining", "herblore", "agility", "thieving",
  "farming", "runecrafting", "hunter", "construction", "sailing",
];

interface RankingConfig {
  multipliers: { boss: number; skill: number };
  thresholds: { rank_1: number; rank_2: number; rank_3: number; rank_4: number; rank_5: number; rank_6: number };
  boss_tier_multipliers: { tier_1: number; tier_2: number; tier_3: number; tier_4: number; tier_5: number; toa: number; tob: number; cox: number };
  skill_exp_tiers: { tier_1: number; tier_2: number; tier_3: number; tier_4: number; tier_5: number; max: number };
  skills: string[];
  kc_tiers: { tier_1: number; tier_2: number; tier_3: number; tier_4: number; tier_5: number };
  tier_1_bosses: string[];
  tier_2_bosses: string[];
  tier_3_bosses: string[];
  tier_4_bosses: string[];
  tier_5_bosses: string[];
  raids: { toa: string[]; tob: string[]; cox: string[] };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const tabTrigger = cn(
  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
  "text-muted-foreground border-transparent hover:text-foreground",
  "data-[state=active]:text-foreground data-[state=active]:border-primary",
);

const RANK_ORDER: Record<string, number> = {
  "No Rank": 0, "Rank 1": 1, "Rank 2": 2, "Rank 3": 3, "Rank 4": 4, "Rank 5": 5, "Rank 6": 6,
};

function rankColor(rank: string | null) {
  if (!rank || rank === "No Rank") return "text-muted-foreground";
  const n = parseInt(rank.replace("Rank ", ""), 10);
  if (n >= 6) return "text-yellow-500 font-semibold";
  if (n >= 5) return "text-amber-500 font-semibold";
  if (n >= 4) return "text-orange-500";
  if (n >= 3) return "text-blue-500";
  if (n >= 2) return "text-green-500";
  return "text-muted-foreground";
}

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString();
}

// ── Tag Input ─────────────────────────────────────────────────────────────────

function TagInput({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  function addTag(raw: string) {
    const tags = raw.split(/[,\n]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!tags.length) return;
    const next = [...new Set([...values, ...tags])];
    onChange(next);
    setInput("");
  }

  return (
    <div className="border border-input rounded-md p-2 space-y-2 bg-background">
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-0.5 text-xs">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(input); } }}
        onBlur={() => addTag(input)}
        placeholder="Add boss name, press Enter"
        className="h-7 text-xs border-0 p-0 shadow-none focus-visible:ring-0 bg-transparent"
      />
    </div>
  );
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
}

function StatusCard() {
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/ranking/status`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  async function triggerRun() {
    setRunning(true);
    try {
      await fetch(`${API_URL}/ranking/run`, { method: "POST", headers: getAuthHeaders() });
      // Re-fetch status after a short delay
      setTimeout(() => {
        fetch(`${API_URL}/ranking/status`, { headers: getAuthHeaders() })
          .then((r) => r.json())
          .then(setStatus)
          .catch(() => null)
          .finally(() => setRunning(false));
      }, 2000);
    } catch {
      setRunning(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-6 text-sm">
        <span className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Players ranked:</span>
          <span className="font-medium">{status?.player_count ?? "—"}</span>
        </span>
        <span className="text-muted-foreground">
          Last run:{" "}
          <span className="text-foreground">
            {status?.last_run_at ? new Date(status.last_run_at).toLocaleString() : "Never"}
          </span>
        </span>
        {status?.last_error && (
          <span className="text-destructive text-xs truncate max-w-xs">Error: {status.last_error}</span>
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

      {/* Rank distribution bar */}
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

      {/* Rank filter chips */}
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
                    <td className="px-3 py-2 text-xs text-muted-foreground">{p.username ?? "—"}</td>
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
      .then((data) => { setConfig(data); })
      .catch(() => setError("Failed to load ranking config."))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof RankingConfig>(key: K, val: RankingConfig[K]) {
    setConfig((prev) => prev ? { ...prev, [key]: val } : prev);
    setSaved(false);
    setPreview(null);
  }

  function updateNested<K extends keyof RankingConfig, NK extends keyof RankingConfig[K]>(
    key: K, field: NK, val: RankingConfig[K][NK]
  ) {
    setConfig((prev) => prev ? { ...prev, [key]: { ...(prev[key] as object), [field]: val } } : prev);
    setSaved(false);
    setPreview(null);
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
        const d = await res.json().catch(() => null);
        setError(d?.detail ?? "Preview failed.");
        return;
      }
      setPreview(await res.json());
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
        const d = await res.json().catch(() => null);
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
      {/* Left: form */}
      <div className="flex-1 min-w-0 space-y-6">

        <Section title="Formula Multipliers">
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Boss multiplier" value={config.multipliers.boss} isFloat
              onChange={(v) => updateNested("multipliers", "boss", v)} />
            <NumField label="Skill multiplier" value={config.multipliers.skill} isFloat
              onChange={(v) => updateNested("multipliers", "skill", v)} />
          </div>
          <p className="text-xs text-muted-foreground">Points = (boss_raw × boss_mult + skill_raw × skill_mult) / 2 × 1000</p>
        </Section>

        <Section title="Rank Thresholds (points)">
          <div className="grid grid-cols-3 gap-3">
            {(["rank_1", "rank_2", "rank_3", "rank_4", "rank_5", "rank_6"] as const).map((k) => (
              <NumField key={k} label={k.replace("_", " ").replace("r", "R")} value={config.thresholds[k]} step={1000}
                onChange={(v) => updateNested("thresholds", k, v)} />
            ))}
          </div>
        </Section>

        <Section title="Boss Tier Multipliers">
          <div className="grid grid-cols-4 gap-3">
            {(["tier_1", "tier_2", "tier_3", "tier_4", "tier_5"] as const).map((k) => (
              <NumField key={k} label={k.replace("_", " ").replace("t", "T")} value={config.boss_tier_multipliers[k]}
                onChange={(v) => updateNested("boss_tier_multipliers", k, v)} />
            ))}
            {(["toa", "tob", "cox"] as const).map((k) => (
              <NumField key={k} label={k.toUpperCase()} value={config.boss_tier_multipliers[k]}
                onChange={(v) => updateNested("boss_tier_multipliers", k, v)} />
            ))}
          </div>
        </Section>

        <Section title="Boss KC Tiers">
          <div className="grid grid-cols-5 gap-3">
            {(["tier_1", "tier_2", "tier_3", "tier_4", "tier_5"] as const).map((k) => (
              <NumField key={k} label={`KC tier ${k.slice(-1)}`} value={config.kc_tiers[k]}
                onChange={(v) => updateNested("kc_tiers", k, v)} />
            ))}
          </div>
        </Section>

        <Section title="Skill XP Tiers">
          <div className="grid grid-cols-3 gap-3">
            {(["tier_1", "tier_2", "tier_3", "tier_4", "tier_5", "max"] as const).map((k) => (
              <NumField key={k} label={k === "max" ? "Max XP" : `XP tier ${k.slice(-1)}`}
                value={(config.skill_exp_tiers as Record<string, number>)[k]}
                onChange={(v) => updateNested("skill_exp_tiers", k as keyof typeof config.skill_exp_tiers, v)} />
            ))}
          </div>
        </Section>

        <Section title="Tracked Skills">
          <div className="grid grid-cols-4 gap-1.5">
            {ALL_SKILLS.map((skill) => (
              <label key={skill} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.skills.includes(skill)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...config.skills, skill]
                      : config.skills.filter((s) => s !== skill);
                    update("skills", next);
                  }}
                  className="rounded border-input"
                />
                <span className="truncate">{skill}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Boss Tier Lists">
          {(["tier_1_bosses", "tier_2_bosses", "tier_3_bosses", "tier_4_bosses", "tier_5_bosses"] as const).map((k, i) => (
            <div key={k} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">T{i + 1} Bosses</p>
              <TagInput values={config[k]} onChange={(v) => update(k, v)} />
            </div>
          ))}
        </Section>

        <Section title="Raids">
          {(["toa", "tob", "cox"] as const).map((raid) => (
            <div key={raid} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{raid.toUpperCase()}</p>
              <TagInput
                values={config.raids[raid]}
                onChange={(v) => update("raids", { ...config.raids, [raid]: v })}
              />
            </div>
          ))}
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

          {/* Diff table — only changed rows */}
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
                      const dir = RANK_ORDER[p.preview_rank] > RANK_ORDER[p.current_rank ?? "No Rank"] ? 1 : -1;
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
                            {p.points_delta != null ? `${p.points_delta > 0 ? "+" : ""}${p.points_delta.toLocaleString()}` : "—"}
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ranking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Daily WOM-based clan ranking — boss KC and skill XP.
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
