import type { ReactNode } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTileRaceDate } from "@/lib/tilerace";
import { cn } from "@/lib/utils";

interface NextEvent {
  name: string;
  is_active: boolean;
  starts_at?: string | null;
}

interface Props {
  name: string;
  ended: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  rollsPaused: boolean;
  nextEvent?: NextEvent | null;
  daysLeft: number | null;
  signup: ReactNode;
  onManage: (() => void) | null;
}

/** The event head: state, name, dates, the paused, next-event and days-left labels, signup and Manage. */
export function TileRaceHeader({ name, ended, startsAt, endsAt, rollsPaused, nextEvent, daysLeft, signup, onManage }: Props): React.ReactElement {
  return (
    <section className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{ended ? "Concluded Event" : "Active Event"}</p>
        <h1 className="font-rs-bold text-4xl leading-tight text-mark md:text-5xl">{name}</h1>
        {endsAt && (
          <p className="text-sm text-muted-foreground">
            {startsAt ? `${formatTileRaceDate(startsAt)} - ${formatTileRaceDate(endsAt)}` : `Ends ${formatTileRaceDate(endsAt)}`}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs font-bold uppercase tracking-wide">
          {rollsPaused && !ended && <span className="text-destructive">Rolls paused</span>}
          {nextEvent && (
            <span className="text-mk-blue">
              {nextEvent.is_active ? "Now running" : "Next"}: {nextEvent.name}{nextEvent.starts_at ? `, ${formatTileRaceDate(nextEvent.starts_at)}` : ""}
            </span>
          )}
          {daysLeft !== null && (
            <span className={cn(daysLeft <= 3 ? "text-destructive" : "text-muted-foreground")}>
              {daysLeft === 0 ? "Ends today" : `${daysLeft}d remaining`}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {signup}
          {onManage && (
            <Button size="sm" variant="outline" onClick={onManage}><Settings />Manage</Button>
          )}
        </div>
      </div>
    </section>
  );
}
