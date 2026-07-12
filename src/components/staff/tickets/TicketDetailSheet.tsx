import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { STATUS_BADGE } from "./constants";
import {
  deriveFirstResponder, firstResponseMs, fmtDateTime, fmtDuration, fmtTime, fmtType,
  resolutionMs,
} from "./format";
import { StaffAvatar } from "./StaffAvatar";
import { TranscriptView } from "./TranscriptView";
import type { StaffRef, TicketSummary, Transcript } from "./types";

interface TicketDetailSheetProps {
  ticket: TicketSummary | null;
  transcript: Transcript | null;
  transcriptLoading: boolean;
  onClose: () => void;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function PeopleRow({ label, people }: { label: string; people: StaffRef[] }) {
  if (!people.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex flex-wrap gap-2">
        {people.map((p) => (
          <div key={p.id} className="rounded-full border border-border bg-muted/40 px-2 py-0.5">
            <StaffAvatar name={p.display_name} avatarUrl={p.avatar_url} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TicketDetailSheet({
  ticket, transcript, transcriptLoading, onClose,
}: TicketDetailSheetProps) {
  const firstResponder = useMemo(
    () => (ticket ? deriveFirstResponder(ticket, transcript) : null),
    [ticket, transcript],
  );
  const isSensitive = ticket?.ticket_type === "sensitive";
  const creatorName = ticket?.creator.rsn ?? ticket?.creator.display_name ?? "";

  return (
    <Sheet open={!!ticket} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="sm:max-w-xl flex flex-col p-0 gap-0">
        {ticket && (
          <>
            <SheetHeader className="p-4 border-b border-border shrink-0 space-y-3">
              <SheetTitle className="flex items-center gap-2 font-rs-bold text-primary">
                #{String(ticket.ticket_id).padStart(4, "0")}
                <span className="text-base font-normal text-foreground">{fmtType(ticket.ticket_type)}</span>
                <Badge className={cn("ml-auto text-xs border-0", STATUS_BADGE[ticket.status] ?? STATUS_BADGE.closed)}>
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </Badge>
              </SheetTitle>

              <div className="grid grid-cols-2 gap-2">
                <Metric label="Opened" value={fmtDateTime(ticket.created_at)} />
                <Metric label="Closed" value={ticket.closed_at ? fmtDateTime(ticket.closed_at) : "-"} />
                <Metric label="First response" value={fmtDuration(firstResponseMs(ticket))} />
                <Metric label="Resolution" value={fmtDuration(resolutionMs(ticket))} />
              </div>

              <div className="space-y-2">
                <PeopleRow label="Creator" people={[{
                  id: ticket.creator.id,
                  display_name: creatorName,
                  avatar_url: ticket.creator.avatar_url,
                }]} />
                {ticket.closed_by && <PeopleRow label="Closed by" people={[ticket.closed_by]} />}
                {firstResponder && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">First reply</span>
                    <div className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5">
                      <StaffAvatar
                        name={firstResponder.author_display_name}
                        avatarUrl={firstResponder.author_avatar_url}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{fmtTime(firstResponder.timestamp)}</span>
                  </div>
                )}
                <PeopleRow
                  label="Participants"
                  people={ticket.participants.filter((p) => p.id !== ticket.creator.id)}
                />
              </div>

              {ticket.staff_note && !isSensitive && (
                <p className="text-xs bg-yellow-500/10 rounded px-2 py-1 text-yellow-600 dark:text-yellow-400">
                  <span className="font-medium">Note:</span> {ticket.staff_note}
                </p>
              )}
              {ticket.close_reason && !isSensitive && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Close reason:</span> {ticket.close_reason}
                </p>
              )}
            </SheetHeader>

            <Separator />

            {isSensitive ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Transcript hidden for sensitive tickets.</p>
            ) : transcriptLoading && !transcript ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Loading transcript...</p>
            ) : (
              <TranscriptView
                transcript={transcript}
                firstResponderMessageId={firstResponder?.message_id ?? null}
              />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
