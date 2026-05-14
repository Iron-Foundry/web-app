export interface WomStats {
  member_count: number | null;
  total_xp: number | null;
  total_ehb: number | null;
  cox_kc: number | null;
  tob_kc: number | null;
  toa_kc: number | null;
}

export interface ClanStats {
  total_gp: number;
  collection_log_items: number;
  total_clogs: number;
}

export interface CompetitionFixture {
  id: number;
  title: string;
  metric: string;
  status: "ongoing" | "upcoming" | "finished";
  startsAt: string;
  endsAt: string;
  participantCount?: number;
}

export interface PlayerPublic {
  rsn: string;
  rank: string;
  points: number;
  boss_points: number;
  skill_points: number;
  join_date: string | null;
  total_loot_value: number | null;
  stats_opt_out: boolean;
}
