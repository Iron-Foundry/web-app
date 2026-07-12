import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { avgResolutionTime, firstResponseMs, fmtDuration } from "./format";
import { buildStaffStats } from "./stats";
import type { TicketSummary } from "./types";

function StatCard({ value, label, tone }: { value: string | number; label: string; tone?: "green" }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className={tone === "green"
          ? "text-2xl font-rs-bold text-green-600 dark:text-green-400"
          : "text-2xl font-rs-bold text-primary"}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export function StatCards({ tickets }: { tickets: TicketSummary[] }) {
  const s = useMemo(() => {
    const open = tickets.filter((t) => t.status === "open").length;
    const frDurations = tickets
      .map(firstResponseMs)
      .filter((ms): ms is number => ms !== null);
    const avgFr = frDurations.length
      ? frDurations.reduce((a, b) => a + b, 0) / frDurations.length
      : null;
    return {
      total: tickets.length,
      open,
      closed: tickets.length - open,
      avgRes: avgResolutionTime(tickets),
      avgFr: fmtDuration(avgFr),
      staff: buildStaffStats(tickets).length,
    };
  }, [tickets]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard value={s.total} label="Total" />
      <StatCard value={s.open} label="Open" tone="green" />
      <StatCard value={s.closed} label="Closed" />
      <StatCard value={s.avgFr} label="Avg 1st Response" />
      <StatCard value={s.avgRes} label="Avg Resolution" />
      <StatCard value={s.staff} label="Staff Involved" />
    </div>
  );
}
