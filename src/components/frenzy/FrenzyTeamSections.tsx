import { FrenzyActivityList } from "./FrenzyActivityList";
import { FrenzyMilestoneGroup } from "./FrenzyMilestoneGroup";
import { FrenzyMultiplierPanel } from "./FrenzyMultiplierPanel";
import { FrenzySourceCard } from "./FrenzySourceCard";
import { FrenzyTeamCharts } from "./FrenzyTeamCharts";
import { FrenzyTeamRail, sectionId, type RailEntry } from "./FrenzyTeamRail";
import { isMultiplierUnlocked } from "@/lib/frenzy";
import { cardFactor, itemKey } from "@/lib/frenzyCard";
import type { FrenzyTeamDetail, FrenzyTierData } from "@/types/frenzy";

function tierCount(tierName: string, tier: FrenzyTierData, progress: Record<string, number>): string {
  const items = tier.sources.flatMap((s) => s.items.map((i) => ({ i, key: itemKey(tierName, s.name, i.name) })));
  const done = items.filter(({ i, key }) => (progress[key] ?? 0) >= i.required).length;
  return `${done}/${items.length}`;
}

function Section({ id, title, aside, children }: { id: string; title: string; aside?: string; children: React.ReactNode }): React.ReactElement {
  return (
    <section id={id} className="scroll-mt-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-rs-bold text-2xl text-primary">{title}</h2>
        {aside && <span className="text-sm text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export function FrenzyTeamSections({ detail, teamSlug }: { detail: FrenzyTeamDetail; teamSlug: string }): React.ReactElement {
  const { template, progress, scores } = detail;
  const unlocked = template.multipliers.filter((m) => isMultiplierUnlocked(m, progress.item_progress));
  const tiers = Object.entries(template.tiers);
  const entries: RailEntry[] = [
    ...tiers.map(([name, tier]) => ({ id: sectionId(name), label: name, count: tierCount(name, tier, progress.item_progress), group: "Items" as const })),
    { id: sectionId("Activities"), label: "Activities", count: String(template.activities.length), group: "Goals" },
    { id: sectionId("Milestones"), label: "Milestones", count: String(Object.values(template.milestones).flat().length), group: "Goals" },
    { id: sectionId("Multipliers"), label: "Multipliers", count: `${unlocked.length}/${template.multipliers.length}`, group: "Goals" },
    { id: sectionId("Charts"), label: "Charts", group: "Goals" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <FrenzyTeamRail entries={entries} />
      <div className="min-w-0 space-y-8">
        {tiers.map(([name, tier]) => (
          <Section
            key={name}
            id={sectionId(name)}
            title={name}
            aside={`${tierCount(name, tier, progress.item_progress)} items · ${Math.floor(scores.tier_points[name] ?? 0).toLocaleString()} pts`}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {tier.sources.map((source) => (
                <FrenzySourceCard
                  key={source.name}
                  tierName={name}
                  source={source}
                  itemProgress={progress.item_progress}
                  factor={cardFactor(source.name, unlocked)}
                />
              ))}
            </div>
          </Section>
        ))}
        <Section id={sectionId("Activities")} title="Activities" aside={`${Math.floor(scores.activity_points).toLocaleString()} pts`}>
          <FrenzyActivityList activities={template.activities} activityProgress={progress.activity_progress} />
        </Section>
        <Section id={sectionId("Milestones")} title="Milestones" aside={`${Math.floor(scores.milestone_points).toLocaleString()} pts`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(template.milestones).map(([category, list]) => (
              <FrenzyMilestoneGroup key={category} category={category} milestones={list} milestoneProgress={progress.milestone_progress} />
            ))}
          </div>
        </Section>
        <Section id={sectionId("Multipliers")} title="Multipliers">
          <FrenzyMultiplierPanel multipliers={template.multipliers} itemProgress={progress.item_progress} />
        </Section>
        <FrenzyTeamCharts id={sectionId("Charts")} teamSlug={teamSlug} participants={detail.participants} />
      </div>
    </div>
  );
}
