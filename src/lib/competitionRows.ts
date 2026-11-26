import type { MetricParticipation, OvertimePlayerSeries, TeamRow } from "@/types/competitions";

/** The standings rows a competition tab builds from WOM participations: players, teams and raid groups. */

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
