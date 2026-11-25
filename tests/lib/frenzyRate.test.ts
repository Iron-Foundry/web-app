import { describe, expect, test } from "bun:test";
import type { LootRateRow } from "@/api/osrsclans";
import { applyRateRow, byHours, rowHours } from "@/lib/frenzyRate";
import type { FrenzyItem } from "@/types/frenzy";

function row(partial: Partial<LootRateRow>): LootRateRow {
  return {
    item_id: 20997,
    item_name: "Twisted bow",
    source: "Ancient chest#Normal Mode",
    page: "Chambers of Xeric",
    section: "Normal Mode",
    category: "raid",
    drop_type: "combat",
    group: null,
    lines: [],
    chance: 0.0003,
    alt_chance: null,
    per_purple: true,
    uniques_per_raid: null,
    chance_per_raid: 0.0025,
    kills_per_hour: 3.5,
    kills_per_hour_ironman: 3.5,
    kill_rate_source: "fixed",
    wom_metric: null,
    skill: null,
    ge_price: null,
    high_alchemy: null,
    read_at: "2026-11-25T04:33:22Z",
    ...partial,
  } as LootRateRow;
}

const ITEM: FrenzyItem = {
  name: "Twisted bow",
  points: 300,
  required: 1,
  duplicate_required: 1,
  icon_url: null,
  drop_denom: 99,
  kph: 9,
  points_locked: false,
};

describe("applyRateRow", () => {
  test("a raid row uses the chance a raid", () => {
    const item = applyRateRow(ITEM, row({}));
    expect([item.drop_denom, item.kph, item.rate_source, item.rate_category]).toEqual([
      400, 3.5, "Ancient chest#Normal Mode", "raid",
    ]);
  });

  test("a row with no kill rate leaves kph empty", () => {
    expect(applyRateRow(ITEM, row({ kills_per_hour: null, chance_per_raid: null, chance: 0.01 })).kph).toBeNull();
  });
});

describe("byHours", () => {
  test("puts the fastest first and the unrated last", () => {
    const slow = row({ source: "slow", chance_per_raid: null, chance: 0.001, kills_per_hour: 10 });
    const fast = row({ source: "fast", chance_per_raid: null, chance: 0.01, kills_per_hour: 10 });
    const none = row({ source: "none", kills_per_hour: null });
    expect(byHours([none, slow, fast]).map((r) => r.source)).toEqual(["fast", "slow", "none"]);
    expect(rowHours(fast)).toBeCloseTo(10);
  });
});
