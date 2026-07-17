export interface PlayerBadge {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  color: string;
  text_color: string;
  assigned_at?: string | null;
}

export interface FeedItem {
  type: string;
  timestamp: string;
  label: string;
  detail: string | null;
  value: number | null;
  rsn: string | null;
}

export interface NameChange {
  old_name: string;
  new_name: string;
  resolved_at: string | null;
}

export interface WomStatsResponse {
  member_count: number;
  total_xp: number;
  total_ehb: number;
  cox_kc: number;
  tob_kc: number;
  toa_kc: number;
}

export interface MeStats {
  collection_log_slots: number;
  collection_log_slots_max: number;
  total_loot_value: number;
  rank_tier: string | null;
}

export interface AccountRanking {
  rsn: string;
  is_primary: boolean;
  rank: string | null;
  points: number | null;
  boss_points: number | null;
  skill_points: number | null;
}

export interface PlayerSnapshot {
  rsn: string | null;
  skills: Record<string, number>;
  bosses: Record<string, number>;
  activities: Record<string, number>;
  fetched_at: string | null;
}

export type AchievementType = "drop" | "level" | "xp_milestone";

export interface Achievement {
  type: AchievementType;
  player: string;
  label: string;
  detail?: string;
  value: number;
}
