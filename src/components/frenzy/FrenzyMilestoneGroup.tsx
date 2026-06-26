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
        const cap = m.tier4 > 0 ? m.tier4 : 1;
        const fillPct = Math.min((current / cap) * 100, 100);
        const thresholds = [m.tier1, m.tier2, m.tier3];
        const maxPts = m.point_step * 4 * m.multiplier;

        return (
          <div key={m.name} className="rounded-lg border bg-card p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{m.name}</span>
              {pts > 0 ? (
                <span className="text-sm font-semibold text-green-500">+{Math.floor(pts)}</span>
              ) : (
                <span className="text-sm text-muted-foreground">{maxPts} max</span>
              )}
            </div>

            <div className="relative h-2 w-full rounded-full bg-muted overflow-visible">
              <div
                className={`h-full rounded-full transition-all ${
                  tiersDone === 4 ? "bg-green-500" : "bg-primary"
                }`}
                style={{ width: `${fillPct}%` }}
              />
              {thresholds.map((threshold) => {
                const markerPct = cap > 0 ? (threshold / cap) * 100 : 0;
                return (
                  <div
                    key={threshold}
                    className="absolute top-0 bottom-0 w-px bg-background/70"
                    style={{ left: `${markerPct}%` }}
                  />
                );
              })}
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {current.toLocaleString()} {m.unit}
                {tiersDone === 4 && m.multiplier > 1 && (
                  <span className="text-yellow-500 ml-1">x{m.multiplier}</span>
                )}
              </span>
              <span>{m.tier4.toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
