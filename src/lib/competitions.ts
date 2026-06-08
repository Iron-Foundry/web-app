import type { MetricParticipation, OvertimePlayerSeries, TeamRow } from "@/types/competitions";

const SKILL_METRICS = new Set([
  "overall", "attack", "defence", "strength", "hitpoints", "ranged", "prayer",
  "magic", "cooking", "woodcutting", "fletching", "fishing", "firemaking",
  "crafting", "smithing", "mining", "herblore", "agility", "thieving", "slayer",
  "farming", "runecrafting", "hunter", "construction", "sailing",
]);

export const RAID_GROUPS: Record<string, { label: string; variants: string[] }> = {
  chambers_of_xeric: {
    label: "Chambers of Xeric",
    variants: ["chambers_of_xeric", "chambers_of_xeric_challenge_mode"],
  },
  theatre_of_blood: {
    label: "Theatre of Blood",
    variants: ["theatre_of_blood", "theatre_of_blood_hard_mode"],
  },
  tombs_of_amascut: {
    label: "Tombs of Amascut",
    variants: ["tombs_of_amascut", "tombs_of_amascut_expert_mode"],
  },
};

export const VARIANT_LABELS: Record<string, string> = {
  chambers_of_xeric: "Standard",
  chambers_of_xeric_challenge_mode: "Challenge Mode",
  theatre_of_blood: "Standard",
  theatre_of_blood_hard_mode: "Hard Mode",
  tombs_of_amascut: "Entry Mode",
  tombs_of_amascut_expert_mode: "Expert Mode",
};

const METRIC_TO_RAID_GROUP: Record<string, string> = Object.fromEntries(
  Object.entries(RAID_GROUPS).flatMap(([key, { variants }]) =>
    variants.map((v) => [v, key]),
  ),
);

export type TabDescriptor =
  | { kind: "single"; metric: string; label: string }
  | { kind: "raid"; groupKey: string; label: string; variants: string[] };

export function raidSplitSentinel(groupKey: string): string {
  return `__split:${groupKey}`;
}

export function buildMetricTabs(metrics: string[]): TabDescriptor[] {
  const splitGroups = new Set(
    metrics
      .filter((m) => m.startsWith("__split:"))
      .map((m) => m.slice("__split:".length)),
  );

  const tabs: TabDescriptor[] = [];
  const seen = new Set<string>();

  for (const metric of metrics) {
    if (seen.has(metric) || metric.startsWith("__split:")) continue;
    const groupKey = METRIC_TO_RAID_GROUP[metric];
    if (groupKey && !splitGroups.has(groupKey)) {
      const group = RAID_GROUPS[groupKey];
      if (group) {
        const presentVariants = group.variants.filter((v) => metrics.includes(v));
        presentVariants.forEach((v) => seen.add(v));
        if (presentVariants.length >= 2) {
          tabs.push({ kind: "raid", groupKey, label: group.label, variants: presentVariants });
          continue;
        }
      }
    }
    seen.add(metric);
    tabs.push({ kind: "single", metric, label: fmtCompetitionLabel(metric) });
  }
  return tabs;
}

export function sanitizeParticipations(ps: MetricParticipation[]): MetricParticipation[] {
  return ps.map((p) => ({
    ...p,
    gained: Math.max(0, p.gained),
    start: Math.max(0, p.start),
    end: Math.max(0, p.end),
  }));
}

export interface RaidPlayerRow {
  rank: number;
  player_name: string;
  team_name: string | null;
  variants: Record<string, number>;
  total: number;
}

export function buildRaidRows(
  variantData: { metric: string; participations: MetricParticipation[] }[],
): RaidPlayerRow[] {
  const players = new Map<string, RaidPlayerRow>();

  for (const { metric, participations } of variantData) {
    for (const p of sanitizeParticipations(participations)) {
      if (!players.has(p.player_name)) {
        players.set(p.player_name, {
          rank: 0,
          player_name: p.player_name,
          team_name: p.team_name,
          variants: {},
          total: 0,
        });
      }
      const row = players.get(p.player_name)!;
      row.variants[metric] = p.gained;
      row.total += p.gained;
    }
  }

  return [...players.values()]
    .sort((a, b) => b.total - a.total)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export interface RaidTeamRow {
  rank: number;
  team_name: string;
  variants: Record<string, number>;
  total: number;
  members: RaidPlayerRow[];
}

export function buildRaidTeamRows(rows: RaidPlayerRow[]): RaidTeamRow[] {
  const teams = new Map<string, RaidTeamRow>();

  for (const row of rows) {
    const key = row.team_name ?? "__none__";
    if (!teams.has(key)) {
      teams.set(key, {
        rank: 0,
        team_name: key === "__none__" ? "No Team" : key,
        variants: {},
        total: 0,
        members: [],
      });
    }
    const team = teams.get(key)!;
    team.members.push(row);
    team.total += row.total;
    for (const [m, v] of Object.entries(row.variants)) {
      team.variants[m] = (team.variants[m] ?? 0) + v;
    }
  }

  return [...teams.values()]
    .sort((a, b) => b.total - a.total)
    .map((t, i) => ({
      ...t,
      rank: i + 1,
      members: [...t.members].sort((a, b) => b.total - a.total),
    }));
}

export function fmtCompetitionLabel(metric: string): string {
  return metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fmtGained(v: number, metric: string): string {
  if (SKILL_METRICS.has(metric)) {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M xp`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}K xp`;
    return `${v} xp`;
  }
  return v.toLocaleString();
}

export function fmtCompDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function rankEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export function statusColor(status: string): string {
  if (status === "ongoing") return "bg-green-500/15 text-green-400 border-green-500/20";
  if (status === "upcoming") return "bg-blue-500/15 text-blue-400 border-blue-500/20";
  return "bg-muted text-muted-foreground";
}

export function mergeRaidOvertimeSeries(
  allSeries: OvertimePlayerSeries[][],
): OvertimePlayerSeries[] {
  if (allSeries.length === 0) return [];
  if (allSeries.length === 1) return allSeries[0] ?? [];

  const allDates = Array.from(
    new Set(allSeries.flatMap((s) => s.flatMap((p) => p.history.map((h) => h.date)))),
  ).sort();

  const playerNames = new Set(allSeries.flatMap((s) => s.map((p) => p.player_name)));

  const combined = [...playerNames].map((name) => {
    const history = allDates.map((date) => {
      let total = 0;
      for (const variantSeries of allSeries) {
        const playerData = variantSeries.find((p) => p.player_name === name);
        if (!playerData) continue;
        let lastKnown = 0;
        for (const point of playerData.history) {
          if (point.date <= date) lastKnown = point.value;
          else break;
        }
        total += lastKnown;
      }
      return { date, value: total };
    });

    const deduped = history.filter((point, i, arr) => {
      if (i === 0 || i === arr.length - 1) return true;
      return point.value !== arr[i - 1]!.value || point.value !== arr[i + 1]!.value;
    });

    return { player_name: name, history: deduped };
  });

  return combined
    .sort((a, b) => {
      const aLast = a.history[a.history.length - 1]?.value ?? 0;
      const bLast = b.history[b.history.length - 1]?.value ?? 0;
      return bLast - aLast;
    })
    .slice(0, 5);
}

export function buildTeamRows(participations: MetricParticipation[]): TeamRow[] {
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
