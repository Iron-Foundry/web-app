import type { PlayerBadge } from "@/types/members";

export interface PbEntry {
  player_name: string;
  activity: string;
  variant: string;
  time_seconds: number;
  clan_rank?: string | null;
  discord_rank?: string | null;
}

export interface ClogEntry {
  player_name: string;
  slots: number;
  slots_max: number;
  clan_rank?: string | null;
  discord_rank?: string | null;
}

export interface KcEntry {
  player_name: string;
  kills: number;
  clan_rank?: string | null;
  discord_rank?: string | null;
}

export interface KcBoss {
  metric: string;
  display_name: string;
  entries: KcEntry[];
}

export interface ClueEntry {
  player_name: string;
  score: number;
  clan_rank?: string | null;
  discord_rank?: string | null;
}

export interface ClueTier {
  metric: string;
  display_name: string;
  entries: ClueEntry[];
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

export interface BossBreakdownEntry {
  name: string;
  kc: number;
  points: number;
  first_kill_bonus: number;
  kc_points: number;
  tier_weight: number;
}

export interface SkillBreakdownEntry {
  name: string;
  xp: number;
  points: number;
  xp_points: number;
  milestone_99: number;
  milestone_200m: number;
}

export interface PrestigeBreakdownEntry {
  boss_name: string;
  multiplier: number;
  active: boolean;
}

export interface PlayerBreakdown {
  bosses: BossBreakdownEntry[];
  skills: SkillBreakdownEntry[];
  prestige: PrestigeBreakdownEntry[];
  boss_points: number;
  skill_points: number;
  base_points: number;
  prestige_multiplier: number;
  total_points: number;
}

export type LeaderboardTab = "pb" | "clog" | "kc" | "cluescrolls" | "ranking";

export interface AccountRanking {
  rsn: string;
  rank: string;
  points: number;
  boss_points: number;
  skill_points: number;
}

export interface LatestAchievement {
  type: string;
  label: string;
  detail: string | null;
  timestamp: string;
}

export interface PlayerProfile {
  rsn: string;
  discord_username: string | null;
  discord_avatar_url: string | null;
  join_date: string | null;
  stats_opt_out: boolean;
  accounts: AccountRanking[];
  badges: PlayerBadge[];
  latest_achievement: LatestAchievement | null;
  total_loot_value: number;
  collection_log_slots: number;
  collection_log_slots_max: number;
}
