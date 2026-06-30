import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Users, ExternalLink, Clock } from "lucide-react";
import type { Competition } from "@/types/competitions";

const STATUS_STYLE: Record<Competition["status"], { label: string; className: string }> = {
  ongoing:  { label: "Live",     className: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" },
  upcoming: { label: "Upcoming", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"   },
  finished: { label: "Finished", className: "bg-muted/50 text-muted-foreground border-border"                       },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtMetric(m: string): string {
  return m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function timeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  if (d > 0) return `${d}d ${h}h left`;
  const min = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${min}m left` : `${min}m left`;
}

function SheetCompEntry({ comp }: { comp: Competition }): React.ReactElement {
  const s = STATUS_STYLE[comp.status];
  const isNavigable = comp.status === "ongoing" || comp.status === "upcoming";
  return (
    <li className="px-6 py-3 space-y-1.5 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        {isNavigable ? (
          <Link
            to="/competitions/$compId"
            params={{ compId: String(comp.id) }}
            search={{ tab: undefined }}
            className="font-medium text-foreground text-sm leading-snug hover:text-primary transition-colors"
          >
            {comp.title}
          </Link>
        ) : (
          <span className="font-medium text-foreground text-sm leading-snug">{comp.title}</span>
        )}
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0 mt-0.5", s.className)}>
          {s.label}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground">{fmtMetric(comp.metric)}</div>
      <div className="text-xs text-muted-foreground">{fmtDate(comp.startsAt)} – {fmtDate(comp.endsAt)}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {comp.participantCount > 0 && (
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{comp.participantCount}</span>
          )}
          {comp.status === "ongoing" && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Clock className="h-3 w-3" />{timeLeft(comp.endsAt)}
            </span>
          )}
          {comp.status === "upcoming" && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Clock className="h-3 w-3" />in {timeLeft(comp.startsAt).replace(" left", "")}
            </span>
          )}
        </div>
        <a href={comp.competition_url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          WOM <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </li>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitions: Competition[];
}

/** Full competition history sheet. */
export function CompetitionsSheet({ open, onOpenChange, competitions }: Props): React.ReactElement {
  const ongoing  = competitions.filter((c) => c.status === "ongoing");
  const upcoming = competitions.filter((c) => c.status === "upcoming");
  const finished = competitions.filter((c) => c.status === "finished");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-border">
          <SheetTitle className="font-rs-bold text-2xl text-primary">Competitions</SheetTitle>
          <p className="text-sm text-muted-foreground">{competitions.length} competitions total</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {competitions.length === 0
            ? <p className="px-6 py-8 text-sm text-muted-foreground">No competitions found.</p>
            : (
              <ul className="divide-y divide-border">
                {ongoing.length > 0 && (
                  <>
                    {ongoing.map((c) => <SheetCompEntry key={c.id} comp={c} />)}
                    {(upcoming.length > 0 || finished.length > 0) && <Separator />}
                  </>
                )}
                {upcoming.length > 0 && (
                  <>
                    {upcoming.map((c) => <SheetCompEntry key={c.id} comp={c} />)}
                    {finished.length > 0 && <Separator />}
                  </>
                )}
                {finished.map((c) => <SheetCompEntry key={c.id} comp={c} />)}
              </ul>
            )
          }
        </div>
      </SheetContent>
    </Sheet>
  );
}
