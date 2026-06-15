export interface PollOption {
  label: string;
  metric: string;
}

export type RunStatus =
  | "pending_poll"
  | "poll_active"
  | "competition_pending"
  | "competition_active"
  | "results_announced"
  | "skipped"
  | "error";

export interface ScheduledCompetitionRun {
  id: number;
  schedule_id: number;
  status: RunStatus;
  poll_options_override: PollOption[] | null;
  discord_poll_message_id: string | null;
  discord_poll_channel_id: string | null;
  winning_metric: string | null;
  wom_competition_id: number | null;
  competition_title: string | null;
  poll_starts_at: string | null;
  poll_ends_at: string | null;
  competition_starts_at: string | null;
  competition_ends_at: string | null;
  error_detail: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitionSchedule {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  poll_channel_id: string;
  results_channel_id: string;
  poll_duration_hours: number;
  competition_duration_hours: number;
  recurrence_days: number;
  poll_options: PollOption[];
  title_template: string;
  next_poll_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  active_run: ScheduledCompetitionRun | null;
}

export interface CreateScheduleInput {
  name: string;
  description?: string;
  poll_channel_id: string;
  results_channel_id: string;
  poll_duration_hours: number;
  competition_duration_hours: number;
  recurrence_days: number;
  poll_options: PollOption[];
  title_template?: string;
  next_poll_at: string;
}

export type PatchScheduleInput = Partial<CreateScheduleInput> & {
  is_active?: boolean;
};

export interface PatchRunInput {
  status?: RunStatus;
  winning_metric?: string | null;
  wom_competition_id?: number | null;
  competition_title?: string | null;
  competition_starts_at?: string | null;
  competition_ends_at?: string | null;
  error_detail?: string | null;
}

export interface OverrideOptionsInput {
  options: PollOption[];
  run_id?: number;
}
