import type { FrenzyActivity, FrenzyMilestone, FrenzyMultiplier, FrenzyTierData } from "./frenzyTemplate";
import type { FrenzySubmissionType } from "./frenzySubmission";
import type { components } from "@/api/schema";

export type FrenzySignupList = components["schemas"]["FrenzySignupList"];
export type MyFrenzySignup = components["schemas"]["MyFrenzySignup"];

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
  signups_open: boolean;
  my_signup: MyFrenzySignup | null;
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

/** The active event's board: its tiers, cards and goals, with no team progress. */
export type FrenzyBoard = FrenzyTeamDetail["template"];

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
  signups_open: boolean;
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
