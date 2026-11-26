export type TicketStatus = "open" | "closed" | "archived";

export interface TicketSummary {
  ticket_id: number;
  ticket_type: string;
  status: TicketStatus;
  created_at: string;
  closed_at: string | null;
  close_reason: string | null;
  creator: { id: number; display_name: string; avatar_url: string };
  reopen_history: { reopened_at: string }[];
}

export interface Attachment {
  filename: string;
  url: string;
  size: number;
  content_type: string | null;
}

export interface TranscriptEntry {
  message_id: number;
  author_id: number;
  author_display_name: string;
  author_avatar_url: string;
  author_is_bot: boolean;
  content: string;
  timestamp: string;
  attachments: Attachment[];
}

export interface Transcript {
  ticket_id: number;
  ticket_type: string;
  created_at: string;
  closed_at: string | null;
  close_reason: string | null;
  entries: TranscriptEntry[];
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp"]);

export function isImageAttachment(att: Attachment): boolean {
  if (att.content_type?.startsWith("image/")) return true;
  const ext = att.filename.slice(att.filename.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

/** A ticket's number as the bot shows it: "#" and four digits. */
export function ticketNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

export function ticketTypeLabel(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
