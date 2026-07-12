export interface StaffRef {
  id: number;
  display_name: string;
  avatar_url: string | null;
}

export interface Creator {
  id: number;
  display_name: string;
  avatar_url: string | null;
  rsn: string | null;
}

export interface TicketSummary {
  ticket_id: number;
  ticket_type: string;
  status: "open" | "closed";
  created_at: string;
  closed_at: string | null;
  last_message_at: string | null;
  first_staff_response_at: string | null;
  close_reason: string | null;
  staff_note: string | null;
  creator: Creator;
  closed_by: StaffRef | null;
  participants: StaffRef[];
}

export interface Attachment {
  filename: string;
  url: string;
  size?: number;
  content_type?: string | null;
}

export interface TranscriptEntry {
  message_id: number;
  author_id?: number | null;
  author_display_name: string;
  author_avatar_url: string;
  author_is_bot: boolean;
  content: string;
  timestamp: string;
  attachments: Attachment[];
}

export interface Transcript {
  ticket_id: number;
  entries: TranscriptEntry[];
  staff_note: string | null;
}

export type SortKey =
  | "ticket_id"
  | "ticket_type"
  | "creator"
  | "status"
  | "created_at"
  | "closed_at";
export type SortDir = "asc" | "desc";

export interface StaffStat {
  id: number;
  display_name: string;
  avatar_url: string | null;
  closed: number;
  participated: number;
  avgCloseMs: number | null;
}
