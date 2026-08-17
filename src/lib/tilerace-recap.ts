import type {
  TileRaceRecapDay,
  TileRaceRecapParticipant,
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

export interface RecapContributor extends TileRaceRecapParticipant {
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
 * sees a day's tiles labelled with the day before.
 */
export function formatRecapDay(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", DAY_FORMAT);
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
  const carried = new Map<string, number>();
  return stamps.map((at) => {
    const row: RecapChartRow = {
      label: new Date(at).toLocaleString("en-GB", TIME_FORMAT),
    };
    for (const team of teams) {
      const point = team.position_series.findLast((p) => p.at === at);
      if (point) carried.set(team.slug, point.position);
      row[team.slug] = carried.get(team.slug) ?? 0;
    }
    return row;
  });
}

/** Every tile filed on a day, across all teams, by the verdict it ended on. */
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

/**
 * Every surviving participant, best first, with their share of the team's
 * approved tiles.
 */
export function buildContributors(teams: TileRaceRecapTeam[]): RecapContributor[] {
  return teams
    .flatMap((team) =>
      team.roster.map((participant) => ({
        ...participant,
        team,
        share: team.approved
          ? Math.round((participant.approved / team.approved) * 100)
          : 0,
      })),
    )
    .sort(
      (a, b) =>
        b.approved - a.approved ||
        b.tiles_proven - a.tiles_proven ||
        a.rsn.localeCompare(b.rsn),
    );
}

/** Share of a team's reviewed tiles that were approved. */
export function approvalRate(team: TileRaceRecapTeam): number {
  const reviewed = team.approved + team.rejected;
  return reviewed ? Math.round((team.approved / reviewed) * 100) : 0;
}
