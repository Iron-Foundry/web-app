export interface FrenzyItem {
  name: string;
  points: number;
  required: number;
  duplicate_required: number;
  icon_url: string | null;
}

export interface FrenzySource {
  name: string;
  hovertext: string;
  icon_url: string;
  items: FrenzyItem[];
}

export interface FrenzyTierData {
  sources: FrenzySource[];
}

export interface FrenzyActivity {
  name: string;
  point_step: number;
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
  multiplier: number;
  unit: string;
  req_factor: number;
}

export interface FrenzyMilestone {
  name: string;
  point_step: number;
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
  multiplier: number;
  unit: string;
  req_factor: number;
}

export interface FrenzyMultiplier {
  name: string;
  description: string;
  affects: string[];
  factor: number;
  requirement: string[];
}

export interface FrenzyTemplate {
  id: number;
  name: string;
  description: string | null;
  tiers: Record<string, FrenzyTierData>;
  activities: FrenzyActivity[];
  milestones: Record<string, FrenzyMilestone[]>;
  multipliers: FrenzyMultiplier[];
  version_number: number;
  created_at: string;
  updated_at: string;
}

export interface FrenzyTemplateSummary {
  id: number;
  name: string;
  description: string | null;
  version_number: number;
  created_at: string;
  updated_at: string;
}

export type FrenzyTemplateUpdate = Omit<FrenzyTemplate, "id" | "version_number" | "created_at" | "updated_at">;

export interface FrenzyVersionEditor {
  discord_user_id: number;
  discord_username: string;
  rsn: string | null;
  avatar: string | null;
}

export interface FrenzyVersionSummary {
  id: number;
  version_number: number;
  created_at: string;
  edited_by: FrenzyVersionEditor | null;
}

export interface FrenzyVersionDetail extends FrenzyVersionSummary {
  tiers: Record<string, FrenzyTierData>;
  activities: FrenzyActivity[];
  milestones: Record<string, FrenzyMilestone[]>;
  multipliers: FrenzyMultiplier[];
}

export interface FrenzyTeamSummary {
  id: number;
  name: string;
  slug: string;
  icon_url: string | null;
  sort_order: number;
  total_points: number;
  pending_points: number;
  tier_points: Record<string, number>;
  activity_points: number;
  milestone_points: number;
}

export interface FrenzyActiveEvent {
  id: number;
  name: string;
  wom_comp_id: number | null;
  starts_at: string | null;
  ends_at: string | null;
  template_id: number;
  teams: FrenzyTeamSummary[];
}

export interface FrenzyTeamProgress {
  item_progress: Record<string, number>;
  activity_progress: Record<string, number>;
  milestone_progress: Record<string, number>;
}

export interface FrenzyTeamDetail {
  id: number;
  name: string;
  slug: string;
  icon_url: string | null;
  participants: string[];
  template: {
    tiers: Record<string, FrenzyTierData>;
    activities: FrenzyActivity[];
    milestones: Record<string, FrenzyMilestone[]>;
    multipliers: FrenzyMultiplier[];
  };
  progress: FrenzyTeamProgress;
  scores: TeamScoreBreakdown;
  pending_points: number;
  player_contribution: Record<string, number>;
}

export interface TeamScoreBreakdown {
  tier_points: Record<string, number>;
  activity_points: number;
  milestone_points: number;
  total: number;
}

export interface FrenzyEventSummary {
  id: number;
  name: string;
  template_id: number;
  wom_comp_id: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FrenzyEventDetail extends FrenzyEventSummary {
  leaderboard_metrics: string[];
  trusted_sources: string[];
  teams: Array<{ id: number; name: string; slug: string; icon_url: string | null; sort_order: number; participants: string[] }>;
}

export interface FrenzyLeaderboardRow {
  index: number;
  rsn: string;
  value: number;
}

export interface FrenzyLeaderboardEntry {
  metric: string;
  display_name: string;
  entries: FrenzyLeaderboardRow[];
}

export interface OsrsItem {
  id: number;
  name: string;
  icon_url: string;
  members: boolean;
}

export interface OsrsBoss {
  slug: string;
  name: string;
  icon_url: string;
}

export interface OsrsActivity {
  slug: string;
  name: string;
  icon_url: string;
}

// Submission types

export type FrenzySubmissionSource = "trackscape" | "discord_ocr" | "discord_manual" | "web";
export type FrenzySubmissionType = "item" | "activity" | "milestone";
export type FrenzySubmissionStatus = "pending" | "approved" | "rejected";

export interface FrenzySubmissionReviewer {
  discord_user_id: number;
  discord_username: string;
  rsn: string | null;
}

export interface FrenzySubmission {
  id: number;
  event_id: number;
  team_id: number;
  discord_user_id: number;
  player_rsn: string;
  source: FrenzySubmissionSource;
  submission_type: FrenzySubmissionType;
  payload: Record<string, unknown>;
  status: FrenzySubmissionStatus;
  auto_approved: boolean;
  reviewed_by: FrenzySubmissionReviewer | null;
  reviewed_at: string | null;
  review_notes: string | null;
  submitted_at: string;
  created_at: string;
}

export interface FrenzySubmissionList {
  total: number;
  limit: number;
  offset: number;
  submissions: FrenzySubmission[];
}

export interface FrenzySubmissionCreate {
  discord_user_id: number;
  player_rsn: string;
  source: FrenzySubmissionSource;
  submission_type: FrenzySubmissionType;
  payload: Record<string, unknown>;
  submitted_at?: string | null;
}

// History / chart types

export interface FrenzyHistoryPoint {
  timestamp: string;
  total_points: number;
  player_rsn: string;
  submission_type: FrenzySubmissionType;
  payload: Record<string, unknown>;
}

export interface FrenzyTeamHistory {
  team_slug: string;
  series: FrenzyHistoryPoint[];
  player_contribution: Record<string, number>;
}

export interface FrenzyEventHistoryTeam {
  id: number;
  name: string;
  slug: string;
  series: Array<{ timestamp: string; total_points: number }>;
}

export interface FrenzyEventHistory {
  teams: FrenzyEventHistoryTeam[];
}
