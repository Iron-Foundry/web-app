import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { TranscriptView } from "./TranscriptView";
import { ticketNumber, ticketTypeLabel, type TicketStatus, type TicketSummary, type Transcript } from "./ticketTypes";

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "text-mk-green",
  closed: "text-muted-foreground",
  archived: "text-mk-blue",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

async function fetchTranscript(ticketId: number): Promise<Transcript | null> {
  const r = await fetch(`${API_URL}/members/me/tickets/${ticketId}/transcript`, {
    headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` },
  });
  return r.ok ? ((await r.json()) as Transcript) : null;
}

/** One ticket that opens to its close reason and transcript; the transcript loads on the first open. */
export function TicketRow({ ticket }: { ticket: TicketSummary }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState<Transcript | null | undefined>(undefined);

  function toggle(): void {
    setOpen((o) => !o);
    if (transcript !== undefined) return;
    fetchTranscript(ticket.ticket_id).then(setTranscript, () => setTranscript(null));
  }

  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="grid w-full grid-cols-ticket-row items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-muted sm:grid-cols-ticket-row-dated"
      >
        <Chevron className="h-4 w-4 text-muted-foreground" />
        <span className="font-rs-bold text-primary">{ticketNumber(ticket.ticket_id)}</span>
        <span className="truncate font-medium">{ticketTypeLabel(ticket.ticket_type)}</span>
        <span className={cn("text-xs font-bold uppercase tracking-wide", STATUS_CLASS[ticket.status])}>
          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
        </span>
        <span className="hidden text-xs text-muted-foreground sm:block">{fmtDate(ticket.created_at)}</span>
      </button>
      {open && (
        <div className="border-t border-border">
          {ticket.close_reason && (
            <p className="border-b border-border px-5 py-2.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Close reason:</span> {ticket.close_reason}
            </p>
          )}
          {transcript === undefined
            ? <p className="px-5 py-3 text-sm text-muted-foreground">Loading transcript…</p>
            : <TranscriptView transcript={transcript} />}
        </div>
      )}
    </div>
  );
}
