import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { STATUS_BADGE } from "./constants";
import { fmtDateTime, fmtType } from "./format";
import { StaffAvatar } from "./StaffAvatar";
import type { SortDir, SortKey, TicketSummary } from "./types";

const COLUMNS: [SortKey, string][] = [
  ["ticket_id", "#"],
  ["ticket_type", "Type"],
  ["creator", "Creator"],
  ["status", "Status"],
  ["created_at", "Created"],
  ["closed_at", "Closed"],
];

function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: SortDir } }) {
  if (sort.key !== col) return <ChevronsUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
  return sort.dir === "asc"
    ? <ChevronUp className="ml-1 h-3 w-3" />
    : <ChevronDown className="ml-1 h-3 w-3" />;
}

interface TicketTableProps {
  tickets: TicketSummary[];
  sort: { key: SortKey; dir: SortDir };
  onToggleSort: (key: SortKey) => void;
  onOpen: (ticket: TicketSummary) => void;
}

export function TicketTable({ tickets, sort, onToggleSort, onOpen }: TicketTableProps) {
  return (
    <Card className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map(([key, label]) => (
              <TableHead key={key}>
                <button
                  className="flex items-center text-foreground hover:text-foreground/70 transition-colors"
                  onClick={() => onToggleSort(key)}
                >
                  {label}
                  <SortIcon col={key} sort={sort} />
                </button>
              </TableHead>
            ))}
            <TableHead>Closed by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.ticket_id} className="cursor-pointer" onClick={() => onOpen(ticket)}>
              <TableCell>
                <span className="font-rs-bold text-primary text-xs">
                  #{String(ticket.ticket_id).padStart(4, "0")}
                </span>
              </TableCell>
              <TableCell>
                <div className="text-sm">{fmtType(ticket.ticket_type)}</div>
                {ticket.staff_note && ticket.ticket_type !== "sensitive" && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 truncate max-w-48" title={ticket.staff_note}>
                    {ticket.staff_note}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {ticket.creator.rsn ? (
                  <>
                    <div className="text-sm font-medium">{ticket.creator.rsn}</div>
                    <div className="text-xs text-muted-foreground">{ticket.creator.display_name}</div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">{ticket.creator.display_name}</div>
                )}
              </TableCell>
              <TableCell>
                <Badge className={cn("text-xs border-0", STATUS_BADGE[ticket.status] ?? STATUS_BADGE.closed)}>
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{fmtDateTime(ticket.created_at)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {ticket.closed_at ? fmtDateTime(ticket.closed_at) : "-"}
              </TableCell>
              <TableCell>
                {ticket.closed_by ? (
                  <StaffAvatar name={ticket.closed_by.display_name} avatarUrl={ticket.closed_by.avatar_url} />
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
