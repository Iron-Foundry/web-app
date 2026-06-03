import { calcTierEntryPoints, getTiersCompleted } from "@/lib/frenzy";
import type { FrenzyMilestone } from "@/types/frenzy";

interface Props {
  category: string;
  milestones: FrenzyMilestone[];
  milestoneProgress: Record<string, number>;
}

const CATEGORY_LABELS: Record<string, string> = {
  cluescroll: "Clue Scrolls",
  experience: "Experience",
  killcount: "Kill Count",
};

export function FrenzyMilestoneGroup({ category, milestones, milestoneProgress }: Props) {
  const label = CATEGORY_LABELS[category] ?? category;
  const totalPts = milestones.reduce(
    (acc, m) => acc + calcTierEntryPoints(m, milestoneProgress[m.name] ?? 0),
    0,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h4>
        <span className="text-sm font-semibold">{Math.floor(totalPts).toLocaleString()} pts</span>
      </div>
      {milestones.map((m) => {
        const current = milestoneProgress[m.name] ?? 0;
        const tiersDone = getTiersCompleted(m, current);
        const pts = calcTierEntryPoints(m, current);
        const tiers = [m.tier1, m.tier2, m.tier3, m.tier4];

        return (
          <div key={m.name} className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{m.name}</span>
              <span className="text-sm">
                {pts > 0 ? (
                  <span className="font-semibold text-green-500">+{Math.floor(pts)}</span>
                ) : (
                  <span className="text-muted-foreground">{m.point_step * 4 * m.multiplier} max</span>
                )}
              </span>
            </div>
            <div className="flex gap-1 mb-1">
              {tiers.map((threshold, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className={`h-1.5 w-full rounded-sm ${i < tiersDone ? "bg-green-500" : "bg-muted"}`} />
                  <span className="text-[9px] text-muted-foreground">{threshold.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {current.toLocaleString()} {m.unit}
              {tiersDone === 4 && m.multiplier > 1 && (
                <span className="text-yellow-500 ml-1">× {m.multiplier}</span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
