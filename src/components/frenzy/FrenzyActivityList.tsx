import { calcTierEntryPoints, getTiersCompleted } from "@/lib/frenzy";
import type { FrenzyActivity } from "@/types/frenzy";

interface Props {
  activities: FrenzyActivity[];
  activityProgress: Record<string, number>;
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
        const tiers = [act.tier1, act.tier2, act.tier3, act.tier4];

        return (
          <div key={act.name} className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{act.name}</span>
              <span className="text-sm font-semibold">
                {pts > 0 ? <span className="text-green-500">+{Math.floor(pts)}</span> : `${act.point_step * 4 * act.multiplier} max`}
              </span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              {tiers.map((threshold, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`h-2 w-full rounded-sm ${
                      i < tiersDone ? "bg-green-500" : "bg-muted"
                    }`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {threshold.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {current.toLocaleString()} / {act.tier4.toLocaleString()} {act.unit}
              {tiersDone === 4 && act.multiplier > 1 && (
                <span className="text-yellow-500 ml-1">× {act.multiplier}</span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
