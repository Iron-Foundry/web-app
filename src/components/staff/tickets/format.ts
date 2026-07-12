import type { Attachment, TicketSummary, Transcript, TranscriptEntry } from "./types";

const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp",
]);

export function isImageAttachment(att: Attachment): boolean {
  if (att.content_type?.startsWith("image/")) return true;
  const ext = att.filename.slice(att.filename.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

export function fmtType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit",
  });
}

export function fmtDuration(ms: number | null): string {
  if (ms === null || ms <= 0) return "-";
  const mins = ms / 60_000;
  if (mins < 60) return `${Math.round(mins)}m`;
  const hours = ms / 3_600_000;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function resolutionMs(t: TicketSummary): number | null {
  if (t.status !== "closed" || !t.closed_at) return null;
  const ms = new Date(t.closed_at).getTime() - new Date(t.created_at).getTime();
  return ms > 0 ? ms : null;
}

export function firstResponseMs(t: TicketSummary): number | null {
  if (!t.first_staff_response_at) return null;
  const ms =
    new Date(t.first_staff_response_at).getTime() - new Date(t.created_at).getTime();
  return ms > 0 ? ms : null;
}

export function avgResolutionTime(tickets: TicketSummary[]): string {
  const durations = tickets
    .map(resolutionMs)
    .filter((ms): ms is number => ms !== null);
  if (!durations.length) return "-";
  return fmtDuration(durations.reduce((s, ms) => s + ms, 0) / durations.length);
}

export function deriveFirstResponder(
  ticket: TicketSummary,
  transcript: Transcript | null,
): TranscriptEntry | null {
  if (!transcript) return null;
  return (
    transcript.entries.find(
      (e) =>
        !e.author_is_bot &&
        e.author_id !== ticket.creator.id &&
        e.author_display_name !== ticket.creator.display_name &&
        e.author_display_name !== ticket.creator.rsn,
    ) ?? null
  );
}
