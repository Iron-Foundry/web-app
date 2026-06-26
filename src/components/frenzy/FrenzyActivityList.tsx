import { calcTierEntryPoints, getTiersCompleted } from "@/lib/frenzy";
import type { FrenzyActivity } from "@/types/frenzy";

interface Props {
  activities: FrenzyActivity[];
  activityProgress: Record<string, number>;
}

function formatThreshold(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toLocaleString();
}

export function FrenzyActivityList({ activities, activityProgress }: Props) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No activities configured.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      {activities.map((act) => {
        const current = activityProgress[act.name] ?? 0;
        const tiersDone = getTiersCompleted(act, current);
        const pts = calcTierEntryPoints(act, current);
        const cap = act.tier4 > 0 ? act.tier4 : 1;
        const maxPts = act.point_step * 4 * act.multiplier;

        const segments = [
          { from: 0, to: act.tier1, tier: 1 },
          { from: act.tier1, to: act.tier2, tier: 2 },
          { from: act.tier2, to: act.tier3, tier: 3 },
          { from: act.tier3, to: act.tier4, tier: 4 },
        ];

        return (
          <div key={act.name} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-sm leading-tight">{act.name}</span>
              <div className="text-right shrink-0">
                {pts > 0 ? (
                  <p className="text-sm font-semibold text-green-500">+{Math.floor(pts)}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{maxPts} max</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {current.toLocaleString()} {act.unit}
                  {tiersDone === 4 && act.multiplier > 1 && (
                    <span className="text-yellow-500 ml-1">x{act.multiplier}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex gap-0.5 h-2 w-full rounded-full overflow-hidden">
                {segments.map(({ from, to, tier }) => {
                  const segWidth = ((to - from) / cap) * 100;
                  const segFill = Math.max(0, Math.min(current - from, to - from));
                  const segFillPct = to > from ? (segFill / (to - from)) * 100 : 0;
                  const tierDone = current >= to;

                  return (
                    <div
                      key={tier}
                      className="relative bg-muted overflow-hidden first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${segWidth}%` }}
                    >
                      <div
                        className={`h-full transition-all ${tierDone ? "bg-green-500" : "bg-primary"}`}
                        style={{ width: `${segFillPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px]">
                {[act.tier1, act.tier2, act.tier3, act.tier4].map((threshold, i) => (
                  <span
                    key={i}
                    className={current >= threshold ? "text-green-500" : "text-muted-foreground"}
                  >
                    {formatThreshold(threshold)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
