import { useEffect, useState } from "react";
import { Check, Clock, Link } from "lucide-react";
import { fmtCompDate } from "@/lib/competitions";
import { cn } from "@/lib/utils";
import type { Competition } from "@/types/competitions";

/** The time from `now` until `targetIso` as "1d 2h 3m 4s", dropping leading zero units; "0s" once passed. */
export function countdownText(targetIso: string, now: number): string {
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return "0s";
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = (): void => {
      setNow(Date.now());
      timer = setTimeout(tick, 1000);
    };
    timer = setTimeout(tick, 1000);
    return () => clearTimeout(timer);
  }, []);
  return now;
}

function Countdown({ comp }: { comp: Competition }): React.ReactElement | null {
  const now = useNow();
  if (comp.status === "finished") return null;
  const isLive = comp.status === "ongoing";
  return (
    <p className={cn("inline-flex items-center gap-2 text-sm", isLive ? "text-mk-green" : "text-mk-blue")}>
      <Clock className="h-4 w-4" />
      <span className="font-medium">{isLive ? "Ending in:" : "Starting in:"}</span>
      <span className="font-mono tabular-nums">{countdownText(isLive ? comp.endsAt : comp.startsAt, now)}</span>
    </p>
  );
}

const STATUS_TONE: Record<Competition["status"], string> = { ongoing: "text-mk-green", upcoming: "text-mk-blue", finished: "text-muted-foreground" };

/** The picked competition: title, dates, status, type, participants, share link and countdown. */
export function CompetitionHeader({ comp, onShare, copied }: { comp: Competition; onShare: () => void; copied: boolean }): React.ReactElement {
  return (
    <section className="space-y-2 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-rs-bold text-2xl">{comp.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{fmtCompDate(comp.startsAt)} - {fmtCompDate(comp.endsAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:shrink-0">
          <span className={cn("text-xs font-bold uppercase tracking-wide", STATUS_TONE[comp.status])}>{comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}</span>
          <span>{comp.type === "team" ? "Team" : "Classic"}</span>
          <span>{comp.participantCount} participants</span>
          <button type="button" onClick={onShare} title="Copy share link (busts Discord cache)" aria-label="Copy share link" className="rounded-lg p-1.5 hover:bg-muted hover:text-foreground">
            {copied ? <Check className="h-4 w-4 text-mk-green" /> : <Link className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Countdown comp={comp} />
    </section>
  );
}
