import type { MetricParticipation, TeamRow } from "@/types/competitions";

export const SKILL_METRICS = new Set([
  "overall", "attack", "defence", "strength", "hitpoints", "ranged", "prayer",
  "magic", "cooking", "woodcutting", "fletching", "fishing", "firemaking",
  "crafting", "smithing", "mining", "herblore", "agility", "thieving", "slayer",
  "farming", "runecrafting", "hunter", "construction", "sailing",
]);

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
