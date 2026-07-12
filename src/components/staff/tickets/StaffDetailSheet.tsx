import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fmtDateTime, fmtDuration, fmtType } from "./format";
import { StaffAvatar } from "./StaffAvatar";
import type { StaffStat, TicketSummary } from "./types";

interface StaffDetailSheetProps {
  stat: StaffStat | null;
  tickets: TicketSummary[];
  onClose: () => void;
  onOpenTicket: (ticket: TicketSummary) => void;
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
      <p className="text-lg font-rs-bold text-primary tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function TicketList({
  title, tickets, onOpen,
}: { title: string; tickets: TicketSummary[]; onOpen: (t: TicketSummary) => void }) {
  if (!tickets.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground px-4">{title} ({tickets.length})</p>
      <div className="divide-y divide-border">
        {tickets.map((t) => (
          <button
            key={t.ticket_id}
            onClick={() => onOpen(t)}
            className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-muted/40 transition-colors"
          >
            <span className="font-rs-bold text-primary text-xs shrink-0">
              #{String(t.ticket_id).padStart(4, "0")}
            </span>
            <span className="text-sm text-foreground truncate flex-1">{fmtType(t.ticket_type)}</span>
            <Badge variant="secondary" className="text-[10px] px-1 py-0 shrink-0">{t.status}</Badge>
            <span className="text-xs text-muted-foreground shrink-0">{fmtDateTime(t.created_at)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function StaffDetailSheet({
  stat, tickets, onClose, onOpenTicket,
}: StaffDetailSheetProps) {
  const closed = useMemo(
    () => (stat ? tickets.filter((t) => t.closed_by?.id === stat.id) : []),
    [stat, tickets],
  );
  const participated = useMemo(
    () =>
      stat
        ? tickets.filter(
            (t) =>
              t.closed_by?.id !== stat.id &&
              t.participants.some((p) => p.id === stat.id && p.id !== t.creator.id),
          )
        : [],
    [stat, tickets],
  );

  return (
    <Sheet open={!!stat} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="sm:max-w-lg flex flex-col p-0 gap-0">
        {stat && (
          <>
            <SheetHeader className="p-4 border-b border-border shrink-0 space-y-3">
              <SheetTitle>
                <StaffAvatar name={stat.display_name} avatarUrl={stat.avatar_url} size="md" />
              </SheetTitle>
              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Closed" value={stat.closed} />
                <StatTile label="Joined" value={stat.participated} />
                <StatTile label="Avg Close" value={fmtDuration(stat.avgCloseMs)} />
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto py-3 space-y-4">
              <TicketList title="Closed by them" tickets={closed} onOpen={onOpenTicket} />
              {closed.length > 0 && participated.length > 0 && <Separator />}
              <TicketList title="Participated in" tickets={participated} onOpen={onOpenTicket} />
              {!closed.length && !participated.length && (
                <p className="px-4 text-sm text-muted-foreground">No tickets in current filter.</p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
