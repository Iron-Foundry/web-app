import type { FrenzyEventHistoryTeam, FrenzyHistoryPoint, FrenzySubmissionType } from "@/types/frenzy";

export type TimeRange = "all" | "30d" | "7d" | "24h";
export type TypeFilter = FrenzySubmissionType | "all";

export const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30d", label: "30 days" },
  { value: "7d", label: "7 days" },
  { value: "24h", label: "24h" },
];

export function rangeCutoff(range: TimeRange, now: Date = new Date()): string | null {
  if (range === "all") return null;
  const cutoff = new Date(now);
  if (range === "24h") cutoff.setHours(cutoff.getHours() - 24);
  else cutoff.setDate(cutoff.getDate() - (range === "7d" ? 7 : 30));
  return cutoff.toISOString();
}

export function filterByTimeRange(
  teams: FrenzyEventHistoryTeam[],
  range: TimeRange,
  now: Date = new Date(),
): FrenzyEventHistoryTeam[] {
  const iso = rangeCutoff(range, now);
  if (!iso) return teams;
  return teams.map((t) => ({ ...t, series: t.series.filter((p) => p.timestamp >= iso) }));
}

export function buildDailyData(teams: FrenzyEventHistoryTeam[]): Record<string, string | number>[] {
  const day = (ts: string): string => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const dates = Array.from(new Set(teams.flatMap((t) => t.series.map((p) => day(p.timestamp)))));
  return dates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const team of teams) {
      const points = team.series.filter((p) => day(p.timestamp) === date);
      const gained = points.reduce((acc, p, i, arr) => acc + (p.total_points - (i === 0 ? 0 : (arr[i - 1]?.total_points ?? 0))), 0);
      row[team.name] = Math.floor(gained);
    }
    return row;
  });
}

function withDeltas(raw: FrenzyHistoryPoint[]): (FrenzyHistoryPoint & { delta: number })[] {
  return raw.map((p, i) => ({ ...p, delta: i === 0 ? p.total_points : p.total_points - (raw[i - 1]?.total_points ?? 0) }));
}

function matches(p: FrenzyHistoryPoint, type: TypeFilter, player: string): boolean {
  return (type === "all" || p.submission_type === type) && (player === "all" || p.player_rsn === player);
}

/** Re-accumulates the team's cumulative points from the deltas of the filtered submissions. */
export function recomputeSeries(raw: FrenzyHistoryPoint[], type: TypeFilter, player: string): FrenzyHistoryPoint[] {
  let cumulative = 0;
  return withDeltas(raw)
    .filter((p) => matches(p, type, player))
    .map((p) => {
      cumulative += p.delta;
      return { ...p, total_points: cumulative };
    });
}

export function recomputeContribution(raw: FrenzyHistoryPoint[], type: TypeFilter, player: string): Record<string, number> {
  const contribution: Record<string, number> = {};
  for (const p of withDeltas(raw)) {
    if (matches(p, type, player)) contribution[p.player_rsn] = (contribution[p.player_rsn] ?? 0) + p.delta;
  }
  return contribution;
}
