import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, ExternalLink, Trophy, X } from "lucide-react";
import { timeLeft } from "@/components/members/DashboardCompetitions";
import type { Competition } from "@/types/competitions";

function fmtMetric(m: string): string {
  return m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** The live or upcoming competition above the hero, with its metric, time, links and a dismiss button. */
export function CompetitionNotice({ comp, onDismiss }: { comp: Competition; onDismiss: () => void }): React.ReactElement {
  const isLive = comp.status === "ongoing";
  const tone = isLive ? "text-mk-green" : "text-mk-blue";
  return (
    <aside aria-label={isLive ? "Live competition" : "Upcoming competition"} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-5 py-3.5">
      <Trophy className={`h-5 w-5 shrink-0 ${tone}`} />
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className={`text-xs font-semibold uppercase tracking-wider ${tone}`}>{isLive ? "Live competition" : "Upcoming competition"}</p>
        <p className="truncate font-rs-bold text-lg">{comp.title}</p>
        <p className="flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground">
          <span>{fmtMetric(comp.metric)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{isLive ? `${timeLeft(comp.endsAt)} left` : `starts in ${timeLeft(comp.startsAt)}`}</span>
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        {comp.competition_url && (
          <a href={comp.competition_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            Wise Old Man <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <Link to="/competitions/$compId" params={{ compId: String(comp.id) }} search={{ tab: undefined }} className="inline-flex items-center gap-1 text-primary hover:underline">
          Take me there <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}
