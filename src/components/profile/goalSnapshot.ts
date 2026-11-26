import type { Goal } from "@/types/goals";

interface SnapshotMetrics {
  skills: Record<string, number>;
  bosses: Record<string, number>;
  activities: Record<string, number>;
}

/** The goals with each WOM-tracked goal's current value read from the snapshot. */
export function applySnapshot(goals: Goal[], snapshot: SnapshotMetrics): Goal[] {
  return goals.map((g) => {
    if (!g.wmMetricType || !g.wmMetric) return g;
    const raw = g.wmMetricType === "skill_xp"
      ? snapshot.skills[g.wmMetric]
      : g.wmMetricType === "boss_kc"
        ? snapshot.bosses[g.wmMetric]
        : snapshot.activities[g.wmMetric];
    return raw != null ? { ...g, current: Math.round(raw) } : g;
  });
}
