
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
  nightmare: {
    label: "Nightmare",
    variants: ["nightmare", "phosanis_nightmare"],
  },
};

export const VARIANT_LABELS: Record<string, string> = {
  chambers_of_xeric: "Standard",
  chambers_of_xeric_challenge_mode: "Challenge Mode",
  theatre_of_blood: "Standard",
  theatre_of_blood_hard_mode: "Hard Mode",
  tombs_of_amascut: "Entry Mode",
  tombs_of_amascut_expert_mode: "Expert Mode",
  nightmare: "Nightmare",
  phosanis_nightmare: "Phosani's Nightmare",
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
