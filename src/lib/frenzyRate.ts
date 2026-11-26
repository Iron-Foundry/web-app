import type { LootRateRow } from "@/api/osrsclans";
import { emptyItem } from "@/lib/frenzyCard";
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

/** A drop that comes with every kill, such as the Gauntlet cape, which scores next to nothing. */
export function isGuaranteed(row: Pick<LootRateRow, "chance">): boolean {
  return (row.chance ?? 0) >= 1;
}

/** The collection log drops a card lacks, one item each, rated from the fastest source; guaranteed drops stay out. */
export function collectionLogItems(existing: FrenzyItem[], rows: LootRateRow[]): FrenzyItem[] {
  const have = new Set(existing.map((i) => i.name.toLowerCase()));
  const fastest = new Map<string, LootRateRow>();
  for (const row of byHours(rows.filter((r) => !isGuaranteed(r)))) {
    const key = row.item_name.toLowerCase();
    if (!have.has(key) && !fastest.has(key)) fastest.set(key, row);
  }
  return [...fastest.values()].map((row) =>
    applyRateRow({ ...emptyItem(), name: row.item_name, icon_url: row.image_url ?? null }, row),
  );
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
