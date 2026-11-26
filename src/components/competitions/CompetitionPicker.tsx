import { useState } from "react";
import { fmtCompDate } from "@/lib/competitions";
import { cn } from "@/lib/utils";
import type { Competition } from "@/types/competitions";

const ENDED_LIMIT = 5;

function CompetitionCard({ comp, isSelected, onSelect }: { comp: Competition; isSelected: boolean; onSelect: (id: string) => void }): React.ReactElement {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(String(comp.id))}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-colors hover:bg-muted",
        isSelected ? "border-primary bg-muted" : "border-border bg-card",
      )}
    >
      <span className="block truncate font-semibold">{comp.title}</span>
      <span className="mt-0.5 block text-sm text-muted-foreground">{fmtCompDate(comp.startsAt)} – {fmtCompDate(comp.endsAt)}</span>
      <span className="mt-2 block text-sm text-muted-foreground">{comp.type === "team" ? "Team" : "Classic"} · {comp.participantCount} participants</span>
    </button>
  );
}

interface SectionProps {
  title: string;
  tone: string;
  competitions: Competition[];
  selectedId: string;
  onSelect: (id: string) => void;
  limit?: number;
}

function CompetitionSection({ title, tone, competitions, selectedId, onSelect, limit }: SectionProps): React.ReactElement | null {
  const [showAll, setShowAll] = useState(false);
  if (competitions.length === 0) return null;
  const visible = limit && !showAll ? competitions.slice(0, limit) : competitions;
  return (
    <section className="space-y-2.5">
      <h2 className={cn("text-xs font-bold uppercase tracking-widest", tone)}>{title}</h2>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => <CompetitionCard key={c.id} comp={c} isSelected={selectedId === String(c.id)} onSelect={onSelect} />)}
      </div>
      {limit && competitions.length > limit && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          {showAll ? "Show less" : `Show ${competitions.length - limit} more…`}
        </button>
      )}
    </section>
  );
}

/** The ongoing, upcoming and ended competitions to pick from; ended ones fold after five. */
export function CompetitionPicker({ competitions, selectedId, onSelect }: { competitions: Competition[]; selectedId: string; onSelect: (id: string) => void }): React.ReactElement {
  const by = (status: Competition["status"]): Competition[] => competitions.filter((c) => c.status === status);
  return (
    <div className="space-y-6">
      <CompetitionSection title="Ongoing" tone="text-mk-green" competitions={by("ongoing")} selectedId={selectedId} onSelect={onSelect} />
      <CompetitionSection title="Upcoming" tone="text-mk-blue" competitions={by("upcoming")} selectedId={selectedId} onSelect={onSelect} />
      <CompetitionSection title="Ended" tone="text-muted-foreground" competitions={by("finished")} selectedId={selectedId} onSelect={onSelect} limit={ENDED_LIMIT} />
    </div>
  );
}
