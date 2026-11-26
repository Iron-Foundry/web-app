import type { LootRateRow } from "@/api/osrsclans";
import type { FrenzyItem } from "@/types/frenzyTemplate";

type RateFields = Pick<LootRateRow, "chance" | "chance_per_raid" | "kills_per_hour">;

/** A raid unique balances on its chance a raid; every other row on its chance a kill. */
export function rowChance(row: RateFields): number | null {
  return row.chance_per_raid ?? row.chance ?? null;
}

export function rowHours(row: RateFields): number | null {
  const chance = rowChance(row);
  return chance && row.kills_per_hour ? 1 / (chance * row.kills_per_hour) : null;
}

/** Rows with a rate first, fastest first; rows with no kill rate keep their order at the end. */
export function byHours<R extends RateFields>(rows: R[]): R[] {
  return [...rows].sort((a, b) => (rowHours(a) ?? Infinity) - (rowHours(b) ?? Infinity));
}

/** Fills the item's rate from one OSRSClans row. A row with no kill rate leaves kph to fill by hand. */
export function applyRateRow(item: FrenzyItem, row: LootRateRow): FrenzyItem {
  const chance = rowChance(row);
  return {
    ...item,
    drop_denom: chance ? Math.round(1 / chance) : item.drop_denom,
    kph: row.kills_per_hour ?? null,
    rate_source: row.source,
    kill_rate_source: row.kill_rate_source ?? null,
    rate_category: row.category ?? null,
  };
}
