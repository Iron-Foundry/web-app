import type { PlayerPublic, WomStats, ClanStats, CompetitionFixture } from "./types";

export const FIXTURES = {
  clanStats: {
    wom: {
      member_count: 142,
      total_xp: 48_200_000_000,
      total_ehb: 12400,
      cox_kc: 3840,
      tob_kc: 2100,
      toa_kc: 4560,
    } satisfies WomStats,
    stats: {
      total_gp: 94_300_000_000,
      collection_log_items: 18400,
      total_clogs: 23,
    } satisfies ClanStats,
  },

  competitionOngoing: {
    id: 1,
    title: "Zulrah Kills",
    metric: "zulrah",
    status: "ongoing",
    startsAt: new Date(Date.now() - 86_400_000).toISOString(),
    endsAt: new Date(Date.now() + 2.5 * 86_400_000).toISOString(),
    participantCount: 24,
  } satisfies CompetitionFixture,

  competitionUpcoming: {
    id: 2,
    title: "Barrows Chests",
    metric: "barrows_chests",
    status: "upcoming",
    startsAt: new Date(Date.now() + 1.2 * 86_400_000).toISOString(),
    endsAt: new Date(Date.now() + 8 * 86_400_000).toISOString(),
    participantCount: 0,
  } satisfies CompetitionFixture,

  competitionNone: null as CompetitionFixture | null,

  memberNormal: {
    rsn: "LD salt",
    rank: "Sergeant",
    points: 1450,
    boss_points: 980,
    skill_points: 470,
    join_date: "2024-01-15T00:00:00Z",
    total_loot_value: 94_300_000_000,
    stats_opt_out: false,
  } satisfies PlayerPublic,

  memberOptedOut: {
    rsn: "PrivatePlayer",
    rank: "Corporal",
    points: 600,
    boss_points: 400,
    skill_points: 200,
    join_date: "2024-06-01T00:00:00Z",
    total_loot_value: 5_000_000_000,
    stats_opt_out: true,
  } satisfies PlayerPublic,

  memberNotFound: null as PlayerPublic | null,

  memberUnlinked: {
    rsn: "UnlinkedPlayer",
    rank: "No Rank",
    points: 50,
    boss_points: 30,
    skill_points: 20,
    join_date: null,
    total_loot_value: null,
    stats_opt_out: false,
  } satisfies PlayerPublic,
} as const;
