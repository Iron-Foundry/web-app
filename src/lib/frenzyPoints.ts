import { hoursPerDrop, orderedTiers, reorderTiers } from "@/lib/frenzyCard";
import type { FrenzyItem, FrenzyTierData } from "@/types/frenzyTemplate";

// api-backend `app/routers/frenzy/_points.py` sets the stored points with the same
// rule on save; `fixtures/frenzy_points.json` holds the cases both sides must agree on.
export const POINT_CAP = 1_000_000;
const FULL_COMPLETION_FACTOR = 1.5;

export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

/** Each item's base points: its share of the cap by hours per drop, duplicates counted at half, times its tier's multiplier. */
export function assignItemPoints(tiers: Record<string, FrenzyTierData>): Record<string, FrenzyTierData> {
  const items = Object.values(tiers).flatMap((t) => t.sources.flatMap((s) => s.items));
  const total = items.reduce((sum, item) => sum + (hoursPerDrop(item) ?? 0), 0);
  const basePool = POINT_CAP / FULL_COMPLETION_FACTOR;
  const pointsOf = (item: FrenzyItem, factor: number): number => {
    const hours = hoursPerDrop(item);
    return hours && total ? roundHalfUp((hours / total) * basePool * factor) : 0;
  };
  const scored = Object.fromEntries(
    Object.entries(tiers).map(([name, tier]) => {
      const factor = tier.multiplier || 1;
      return [name, { ...tier, sources: tier.sources.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, points: pointsOf(i, factor) })) })) }];
    }),
  );
  return reorderTiers(scored, orderedTiers(scored).map(([name]) => name));
}
