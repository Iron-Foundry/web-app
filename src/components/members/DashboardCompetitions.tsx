import { Link } from "@tanstack/react-router";
import { Clock, ExternalLink, Trophy, Users } from "lucide-react";
import type { Competition } from "@/types/competitions";
import { cn } from "@/lib/utils";
import { Panel } from "./Panel";

const COMP_LIMIT = 6;

const STATUS: Record<Competition["status"], { label: string; className: string }> = {
  ongoing:  { label: "Live",     className: "text-mk-green" },
  upcoming: { label: "Upcoming", className: "text-mk-blue" },
  finished: { label: "Finished", className: "text-muted-foreground" },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtMetric(m: string): string {
  return m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** The time left until `iso`, as "1d 6h", "3h 20m" or "12m"; "Ended" once it has passed. */
export function timeLeft(iso: string, now: number = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  if (d > 0) return `${d}d ${h}h`;
  const min = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

function CompRow({ comp }: { comp: Competition }): React.ReactElement {
  const s = STATUS[comp.status];
  const isOpen = comp.status !== "finished";
  return (
    <li className="grid gap-1 py-3 text-sm">
      <span className="flex justify-between gap-2 font-semibold">
        {isOpen ? (
          <Link to="/competitions/$compId" params={{ compId: String(comp.id) }} search={{ tab: undefined }} className="transition-colors hover:text-primary">
            {comp.title}
          </Link>
        ) : (
          <span>{comp.title}</span>
        )}
        <span className={cn("shrink-0 text-xs font-bold uppercase tracking-wide", s.className)}>{s.label}</span>
      </span>
      <span className="text-muted-foreground">{fmtMetric(comp.metric)} · {fmtDate(comp.startsAt)} – {fmtDate(comp.endsAt)}</span>
      <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
        {comp.participantCount > 0 && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{comp.participantCount}</span>}
        {comp.status === "ongoing" && <span className="inline-flex items-center gap-1 text-mk-green"><Clock className="h-3.5 w-3.5" />{timeLeft(comp.endsAt)} left</span>}
        {comp.status === "upcoming" && <span className="inline-flex items-center gap-1 text-mk-blue"><Clock className="h-3.5 w-3.5" />in {timeLeft(comp.startsAt)}</span>}
        {comp.competition_url && (
          <a href={comp.competition_url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 transition-colors hover:text-foreground">
            WOM <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </span>
    </li>
  );
}

interface Props {
  competitions: Competition[];
  loading: boolean;
  onShowAll: () => void;
}

/** Live, upcoming and recent competitions, sorted by the hook, with the full list one press away. */
export function DashboardCompetitions({ competitions, loading, onShowAll }: Props): React.ReactElement {
  const hidden = competitions.length - COMP_LIMIT;
  return (
    <Panel
      title={<><Trophy className="h-4 w-4 text-primary" />Competitions</>}
      more={hidden > 0 ? { label: `Show ${hidden} more…`, onClick: onShowAll } : null}
    >
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && competitions.length === 0 && <p className="text-sm italic text-muted-foreground">No competitions found.</p>}
      <ul className="divide-y divide-border">
        {competitions.slice(0, COMP_LIMIT).map((c) => <CompRow key={c.id} comp={c} />)}
      </ul>
    </Panel>
  );
}
