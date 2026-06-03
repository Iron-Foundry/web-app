export interface PbEntry {
  player_name: string;
  activity: string;
  variant: string;
  time_seconds: number;
  clan_rank?: string | null;
}

export interface ClogEntry {
  player_name: string;
  slots: number;
  slots_max: number;
  clan_rank?: string | null;
}

export interface KcEntry {
  player_name: string;
  kills: number;
  clan_rank?: string | null;
}

export interface KcBoss {
  metric: string;
  display_name: string;
  entries: KcEntry[];
}

export interface LeaguesEntry {
  player_name: string;
  score: number;
  clan_rank?: string | null;
}

export interface RankingPlayer {
  rsn: string;
  rank: string;
  points: number;
  boss_points: number;
  skill_points: number;
  discord_user_id: number | null;
  username: string | null;
  clan_rank: string | null;
  alts: string[];
  updated_at: string;
}

export interface RankingResults {
  players: RankingPlayer[];
  total: number;
}

export interface RankingStats {
  total: number;
  rank_distribution: Record<string, number>;
  clan_rank_distribution: Record<string, number>;
  rank_overlap: Record<string, Record<string, number>>;
  avg_boss_pct: number;
  avg_skill_pct: number;
}

export type LeaderboardTab = "pb" | "clog" | "kc" | "leagues" | "ranking";
