import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fmtDuration } from "./format";
import { buildStaffStats } from "./stats";
import { StaffAvatar } from "./StaffAvatar";
import { StaffDetailSheet } from "./StaffDetailSheet";
import type { StaffStat, TicketSummary } from "./types";

interface StaffLeaderboardProps {
  tickets: TicketSummary[];
  onOpenTicket: (ticket: TicketSummary) => void;
}

export function StaffLeaderboard({ tickets, onOpenTicket }: StaffLeaderboardProps) {
  const [selected, setSelected] = useState<StaffStat | null>(null);
  const stats = useMemo(() => buildStaffStats(tickets), [tickets]);

  if (!stats.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Staff Performance</CardTitle>
        <p className="text-xs text-muted-foreground">
          Closures, participation and average close time per staff member. Select a row for detail.
        </p>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff</TableHead>
              <TableHead className="text-right">Closed</TableHead>
              <TableHead className="text-right">Participated</TableHead>
              <TableHead className="text-right">Avg Close</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((s) => (
              <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s)}>
                <TableCell>
                  <StaffAvatar name={s.display_name} avatarUrl={s.avatar_url} size="md" />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums text-foreground">{s.closed}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{s.participated}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{fmtDuration(s.avgCloseMs)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <StaffDetailSheet
        stat={selected}
        tickets={tickets}
        onClose={() => setSelected(null)}
        onOpenTicket={(t) => { setSelected(null); onOpenTicket(t); }}
      />
    </Card>
  );
}
