import { FrenzyActivityList } from "./FrenzyActivityList";
import { FrenzyMilestoneGroup } from "./FrenzyMilestoneGroup";
import { FrenzyMultiplierPanel } from "./FrenzyMultiplierPanel";
import { FrenzySourceCard } from "./FrenzySourceCard";
import { Section } from "./FrenzyTeamSections";
import { FrenzyTeamRail, sectionId, type RailEntry } from "./FrenzyTeamRail";
import { useActiveBoard } from "@/hooks/useFrenzy";
import type { FrenzyBoard } from "@/types/frenzy";

const NO_PROGRESS: Record<string, number> = {};

function itemCount(board: FrenzyBoard, tierName: string): number {
  return board.tiers[tierName]?.sources.reduce((n, s) => n + s.items.length, 0) ?? 0;
}

function railEntries(board: FrenzyBoard): RailEntry[] {
  return [
    ...Object.keys(board.tiers).map((name) => ({ id: sectionId(name), label: name, count: String(itemCount(board, name)), group: "Items" as const })),
    { id: sectionId("Activities"), label: "Activities", count: String(board.activities.length), group: "Goals" },
    { id: sectionId("Milestones"), label: "Milestones", count: String(Object.values(board.milestones).flat().length), group: "Goals" },
    { id: sectionId("Multipliers"), label: "Multipliers", count: String(board.multipliers.length), group: "Goals" },
  ];
}

/** The whole board of the active event, shown while signups are open and no team has progress. */
export function FrenzyEventBoard(): React.ReactElement {
  const { data: board, isLoading, isError } = useActiveBoard(true);
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading the event board...</p>;
  if (isError || !board) return <p className="text-sm text-destructive">The event board did not load.</p>;
  return (
    <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <FrenzyTeamRail entries={railEntries(board)} />
      <div className="min-w-0 space-y-8">
        {Object.entries(board.tiers).map(([name, tier]) => (
          <Section key={name} id={sectionId(name)} title={name} aside={`${itemCount(board, name)} items`}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {tier.sources.map((source) => (
                <FrenzySourceCard key={source.name} tierName={name} source={source} itemProgress={NO_PROGRESS} factor={1} />
              ))}
            </div>
          </Section>
        ))}
        <Section id={sectionId("Activities")} title="Activities">
          <FrenzyActivityList activities={board.activities} activityProgress={NO_PROGRESS} />
        </Section>
        <Section id={sectionId("Milestones")} title="Milestones">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(board.milestones).map(([category, list]) => (
              <FrenzyMilestoneGroup key={category} category={category} milestones={list} milestoneProgress={NO_PROGRESS} />
            ))}
          </div>
        </Section>
        <Section id={sectionId("Multipliers")} title="Multipliers">
          <FrenzyMultiplierPanel multipliers={board.multipliers} itemProgress={NO_PROGRESS} />
        </Section>
      </div>
    </div>
  );
}
