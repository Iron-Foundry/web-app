import type { DraftMember, DraftView } from "@/types/frenzyDraft";

/** The drawn-order position whose turn it is at a 1-based pick number; mirrors the API's snake. */
export function snakeSlot(pick: number, teamCount: number): number {
  const round = Math.floor((pick - 1) / teamCount);
  const pos = (pick - 1) % teamCount;
  return round % 2 === 0 ? pos : teamCount - 1 - pos;
}

export function roundOf(pick: number, teamCount: number): number {
  return Math.floor((pick - 1) / teamCount) + 1;
}

/** The pick number of a cell: a round and a team's position in the drawn order. */
export function pickAt(round: number, position: number, teamCount: number): number {
  const offset = round % 2 === 1 ? position : teamCount - 1 - position;
  return (round - 1) * teamCount + offset + 1;
}

export interface RecentPick {
  pick: number;
  round: number;
  captain: string;
  rsn: string;
}

/** The latest picks, newest first, with the captain who made each one. */
export function recentPicks(view: DraftView, limit: number): RecentPick[] {
  const teams = view.teams.length;
  return view.teams
    .flatMap((team) =>
      team.members
        .filter((m) => m.pick_number !== null)
        .map((m) => {
          const pick = m.pick_number as number;
          return { pick, round: roundOf(pick, teams), captain: team.captain.rsn, rsn: m.rsn };
        }),
    )
    .sort((a, b) => b.pick - a.pick)
    .slice(0, limit);
}

/** The number of rounds the grid draws: the top-pick rounds, or every round of a full draft. */
export function gridRounds(view: DraftView): number {
  const teams = view.teams.length;
  if (teams === 0) return 0;
  if (view.mode === "top_picks") return view.top_picks;
  const signups = view.pool.length + view.teams.reduce((sum, t) => sum + t.members.length, 0);
  return Math.ceil(signups / teams);
}

/** The total of manual picks: the top picks, or every signup of a full draft. */
export function manualPickCount(view: DraftView): number {
  return view.mode === "top_picks" ? view.top_picks * view.teams.length : gridRounds(view) * view.teams.length;
}

/** The signup a team made at a pick number, if it is made. */
export function memberAtPick(view: DraftView, pick: number): DraftMember | null {
  for (const team of view.teams) {
    const found = team.members.find((m) => m.pick_number === pick);
    if (found) return found;
  }
  return null;
}

/** A pool filtered by an RSN search and a rank; the order stays strongest first. */
export function filterPool(pool: DraftMember[], search: string, rank: string | null): DraftMember[] {
  const needle = search.trim().toLowerCase();
  return pool.filter((m) => (!needle || m.rsn.toLowerCase().includes(needle)) && (rank === null || m.rank === rank));
}

export interface TurnHeading {
  title: string;
  detail: string;
}

/** The turn head's two lines for each draft state. */
export function turnHeading(view: DraftView): TurnHeading {
  const teams = view.teams.length;
  const topPicks = view.mode === "top_picks";
  const total = manualPickCount(view);
  if (view.state === "setup") return { title: "Staff are choosing captains", detail: `${view.captains.length} captains chosen` };
  if (view.state === "drawn") {
    const plan = topPicks ? `Top Picks, ${view.top_picks} each, then the rest are handed out` : "Full draft";
    return { title: "The order is drawn", detail: `${teams} captains · ${plan}` };
  }
  if (view.state === "complete") {
    const members = view.teams.flatMap((t) => t.members);
    const handed = members.filter((m) => m.pick_kind === "auto").length;
    return { title: "The draft is complete", detail: `${members.length - handed} picks · ${handed} handed out · ${teams} teams` };
  }
  const captain = view.teams.find((t) => t.team_id === view.picking_team_id)?.captain.rsn ?? "";
  const round = roundOf(view.next_pick, teams);
  const rounds = gridRounds(view);
  const detail = topPicks
    ? `Top pick ${view.next_pick} of ${total} · Round ${round} of ${rounds} · the rest are handed out after round ${rounds}`
    : `Pick ${view.next_pick} of ${total} · Round ${round} of ${rounds}`;
  return { title: `${captain} is picking`, detail };
}

/** The ranks present in a pool, in first-seen order. */
export function poolRanks(pool: DraftMember[]): string[] {
  return [...new Set(pool.map((m) => m.rank).filter((r): r is string => r !== null))];
}
