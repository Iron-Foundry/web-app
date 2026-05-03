export type CompetitionStatus = "upcoming" | "ongoing" | "finished";

export interface Competition {
  id: number;
  title: string;
  metric: string;
  type: string;
  startsAt: string;
  endsAt: string;
  status: CompetitionStatus;
  participantCount: number;
  /** WOM competition URL (present in some endpoints) */
  competition_url?: string;
  metric_url?: string;
  /** WOM group ID (present in member dashboard endpoint) */
  groupId?: number;
  /** User's personal score in the competition */
  score?: number;
}

export interface MetricParticipation {
  rank: number;
  player_name: string;
  team_name: string | null;
  gained: number;
  start: number;
  end: number;
}

export interface MetricDetail {
  id: number;
  title: string;
  metric: string;
  type: string;
  status: string;
  startsAt: string;
  endsAt: string;
  participations: MetricParticipation[];
}

export interface TeamRow {
  team_name: string;
  total_gained: number;
  rank: number;
  members: MetricParticipation[];
}

export type MetricMap = Record<string, string[]>;

export interface CreateCompetitionInput {
  title: string;
  metric: string;
  starts_at: string;
  ends_at: string;
  type?: "classic" | "team";
  participants?: string[];
  teams?: { name: string; participants: string[] }[];
}

export interface EditCompetitionInput {
  title?: string;
  metric?: string;
  starts_at?: string;
  ends_at?: string;
}

export interface ParticipantSuggestion {
  rsn: string;
  discord_username: string;
}
