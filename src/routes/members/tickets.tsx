import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export const membersTicketsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/tickets",
  component: TicketsPage,
});

// ── Types ─────────────────────────────────────────────────────────────────

interface TicketSummary {
  ticket_id: number;
  ticket_type: string;
  status: "open" | "closed" | "archived";
  created_at: string;
  closed_at: string | null;
  close_reason: string | null;
  creator: { id: number; display_name: string; avatar_url: string };
  reopen_history: { reopened_at: string }[];
}

interface Attachment {
  filename: string;
  url: string;
  size: number;
  content_type: string | null;
}

interface TranscriptEntry {
  message_id: number;
  author_id: number;
  author_display_name: string;
  author_avatar_url: string;
  author_is_bot: boolean;
  content: string;
  timestamp: string;
  attachments: Attachment[];
}

interface Transcript {
  ticket_id: number;
  ticket_type: string;
  created_at: string;
  closed_at: string | null;
  close_reason: string | null;
  entries: TranscriptEntry[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_BADGE: Record<string, string> = {
  open:     "bg-green-500/15 text-green-600 dark:text-green-400",
  closed:   "bg-muted text-muted-foreground",
  archived: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

// ── Sub-components ─────────────────────────────────────────────────────────

function TranscriptView({ transcript }: { transcript: Transcript | null }) {
  if (!transcript) {
    return (
      <p className="px-4 py-3 text-sm text-muted-foreground">
        No transcript available for this ticket.
      </p>
    );
  }
  if (transcript.entries.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-muted-foreground">Transcript is empty.</p>
    );
  }

  return (
    <div className="max-h-[28rem] overflow-y-auto divide-y divide-border">
      {transcript.entries.map((entry) => (
        <div
          key={entry.message_id}
          className={cn(
            "flex gap-3 px-4 py-2",
            entry.author_is_bot && "opacity-60",
          )}
        >
          <img
            src={entry.author_avatar_url}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full mt-0.5"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-foreground">
                {entry.author_display_name}
              </span>
              {entry.author_is_bot && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">BOT</Badge>
              )}
              <span className="text-xs text-muted-foreground">{fmtTime(entry.timestamp)}</span>
            </div>
            {entry.content && (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                {entry.content}
              </p>
            )}
            {entry.attachments.map((att) => (
              <a
                key={att.filename}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Paperclip className="h-3 w-3" />
                {att.filename}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: TicketSummary }) {
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState<Transcript | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setOpen((o) => !o);
    if (transcript !== undefined) return;
    setLoading(true);
    const token = getAuthToken();
    try {
      const r = await fetch(`${API_URL}/members/me/tickets/${ticket.ticket_id}/transcript`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      setTranscript(r.ok ? ((await r.json()) as Transcript) : null);
    } catch {
      setTranscript(null);
    } finally {
      setLoading(false);
    }
  }

  const statusClass = STATUS_BADGE[ticket.status] ?? STATUS_BADGE.closed;

  return (
    <Card>
      <CardHeader className="p-0">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
        >
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="font-rs-bold text-primary text-sm">
            #{String(ticket.ticket_id).padStart(4, "0")}
          </span>
          <span className="text-sm font-medium text-foreground flex-1">
            {fmtType(ticket.ticket_type)}
          </span>
          <Badge className={cn("shrink-0 text-xs border-0", statusClass)}>
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </Badge>
          <span className="shrink-0 text-xs text-muted-foreground">
            {fmtDate(ticket.created_at)}
          </span>
        </button>
      </CardHeader>

      {open && (
        <CardContent className="p-0 border-t border-border">
          {ticket.close_reason && (
            <p className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
              <span className="font-medium text-foreground">Close reason:</span>{" "}
              {ticket.close_reason}
            </p>
          )}
          {loading ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Loading transcript…</p>
          ) : (
            <TranscriptView transcript={transcript ?? null} />
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

function TicketsPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { setLoading(false); return; }
    fetch(`${API_URL}/members/me/tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json() as Promise<TicketSummary[]>)
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-4">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Your Tickets</h1>
        <p className="text-muted-foreground text-sm">Support and application tickets you've created.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets found.</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.ticket_id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
