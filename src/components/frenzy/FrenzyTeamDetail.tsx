import { FrenzySourceTable } from "./FrenzySourceTable";
import { FrenzyActivityList } from "./FrenzyActivityList";
import { FrenzyMilestoneGroup } from "./FrenzyMilestoneGroup";
import { FrenzyMultiplierPanel } from "./FrenzyMultiplierPanel";
import { isMultiplierUnlocked } from "@/lib/frenzy";
import type { FrenzyTeamDetail as TeamDetailType } from "@/types/frenzy";

export const FRENZY_SECTIONS = ["Sources", "Activities", "Milestones", "Multipliers"] as const;
export type FrenzySection = (typeof FRENZY_SECTIONS)[number];

interface Props {
  detail: TeamDetailType;
  activeSection: FrenzySection;
  activeTier: string;
}

export function FrenzyTeamDetail({ detail, activeSection, activeTier }: Props) {
  const { template, progress, scores } = detail;

  const multFactors: Record<string, number> = {};
  for (const m of template.multipliers) {
    if (isMultiplierUnlocked(m, progress.item_progress)) {
      for (const src of m.affects) {
        multFactors[src] = (multFactors[src] ?? 1) * m.factor;
      }
    }
  }

  const tierData = template.tiers[activeTier];

  return (
    <div className="space-y-4">
      {/* Sources */}
      {activeSection === "Sources" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {tierData?.sources.map((source) => (
              <FrenzySourceTable
                key={source.name}
                tierName={activeTier}
                source={source}
                itemProgress={progress.item_progress}
                activeMultiplierFactor={multFactors[source.name] ?? 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Activities */}
      {activeSection === "Activities" && (
        <FrenzyActivityList
          activities={template.activities}
          activityProgress={progress.activity_progress}
        />
      )}

      {/* Milestones */}
      {activeSection === "Milestones" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(template.milestones).map(([cat, entries]) => (
            <FrenzyMilestoneGroup
              key={cat}
              category={cat}
              milestones={entries}
              milestoneProgress={progress.milestone_progress}
            />
          ))}
        </div>
      )}

      {/* Multipliers */}
      {activeSection === "Multipliers" && (
        <FrenzyMultiplierPanel
          multipliers={template.multipliers}
          itemProgress={progress.item_progress}
        />
      )}
    </div>
  );
}
