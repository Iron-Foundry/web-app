import type {
  TileRaceRecapDay,
  TileRaceRecapRacer,
  TileRaceRecapTeam,
} from "@/types/tilerace";

/**
 * A merged chart row. Every team contributes one numeric column keyed by its
 * slug, which is unique per event where its name is not.
 */
export interface RecapChartRow {
  label: string;
  [teamSlug: string]: number | string;
}

export interface RecapContributor extends TileRaceRecapRacer {
  team: TileRaceRecapTeam;
  share: number;
}

const DAY_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * Label a `YYYY-MM-DD` bucket.
 *
 * Read as a local date, not UTC midnight, so a viewer west of Greenwich never
 * sees a day's proofs labelled with the day before.
 */
export function formatRecapDay(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", DAY_FORMAT);
}

function merge(
  teams: TileRaceRecapTeam[],
  keys: string[],
  label: (key: string) => string,
  valueAt: (team: TileRaceRecapTeam, key: string) => number | null,
): RecapChartRow[] {
  const carried = new Map<string, number>();
  return keys.map((key) => {
    const row: RecapChartRow = { label: label(key) };
    for (const team of teams) {
      const value = valueAt(team, key);
      if (value !== null) carried.set(team.slug, value);
      row[team.slug] = carried.get(team.slug) ?? 0;
    }
    return row;
  });
}

function sortedUnion(values: string[][]): string[] {
  return Array.from(new Set(values.flat())).sort();
}

/**
 * Board position per team at every moment any team rolled.
 *
 * A team that did not roll at that moment keeps the position it last held, so
 * the stepped line never dips between its own rolls.
 */
export function buildPositionRows(teams: TileRaceRecapTeam[]): RecapChartRow[] {
  const stamps = sortedUnion(teams.map((t) => t.position_series.map((p) => p.at)));
  return merge(
    teams,
    stamps,
    (at) => new Date(at).toLocaleString("en-GB", TIME_FORMAT),
    (team, at) => team.position_series.findLast((p) => p.at === at)?.position ?? null,
  );
}

/** Running total of approved proofs per team, one row per day of the event. */
export function buildCumulativeRows(teams: TileRaceRecapTeam[]): RecapChartRow[] {
  const days = sortedUnion(teams.map((t) => t.submission_series.map((d) => d.day)));
  const running = new Map<string, number>();
  return merge(teams, days, formatRecapDay, (team, day) => {
    const entry = team.submission_series.find((d) => d.day === day);
    if (!entry) return null;
    const total = (running.get(team.slug) ?? 0) + entry.approved;
    running.set(team.slug, total);
    return total;
  });
}

/** Every proof filed on a day, across all teams, by the verdict it ended on. */
export function buildDailyRows(teams: TileRaceRecapTeam[]): TileRaceRecapDay[] {
  const days = new Map<string, TileRaceRecapDay>();
  for (const team of teams) {
    for (const entry of team.submission_series) {
      const row = days.get(entry.day) ?? {
        day: entry.day,
        approved: 0,
        rejected: 0,
        unreviewed: 0,
      };
      row.approved += entry.approved;
      row.rejected += entry.rejected;
      row.unreviewed += entry.unreviewed;
      days.set(entry.day, row);
    }
  }
  return Array.from(days.values()).sort((a, b) => a.day.localeCompare(b.day));
}

/** Every surviving racer, best first, with their share of the team's proofs. */
export function buildContributors(
  teams: TileRaceRecapTeam[],
): RecapContributor[] {
  return teams
    .flatMap((team) =>
      team.roster.map((racer) => ({
        ...racer,
        team,
        share: team.approved ? Math.round((racer.approved / team.approved) * 100) : 0,
      })),
    )
    .sort(
      (a, b) =>
        b.approved - a.approved ||
        b.tiles_proved - a.tiles_proved ||
        a.rsn.localeCompare(b.rsn),
    );
}

/** Share of a team's reviewed proofs that were approved. */
export function approvalRate(team: TileRaceRecapTeam): number {
  const reviewed = team.approved + team.rejected;
  return reviewed ? Math.round((team.approved / reviewed) * 100) : 0;
}
