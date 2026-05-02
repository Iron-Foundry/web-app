export interface PlayerBadge {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  color: string;
  text_color: string;
}

export interface FeedItem {
  type: string;
  timestamp: string;
  label: string;
  detail: string | null;
  value: number | null;
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

export type AchievementType = "drop" | "level" | "xp_milestone";

export interface Achievement {
  type: AchievementType;
  player: string;
  label: string;
  detail?: string;
  value: number;
}
