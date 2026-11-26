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
