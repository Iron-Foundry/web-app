import { describe, expect, test } from "bun:test";
import {
  chanceLabel,
  formatChance,
  normalizedRarity,
  perKillChance,
  rarityLabel,
} from "@/lib/droprate";
import type { LootDrop } from "@/types/reference";

function drop(partial: Partial<LootDrop>): LootDrop {
  return {
    item_id: 1,
    item_name: "Test",
    quantity_low: 1,
    quantity_high: 1,
    noted: false,
    rarity_num: null,
    rarity_denom: null,
    rarity_text: null,
    rolls: 1,
    drop_group: "",
    ge_price: null,
    ...partial,
  };
}

describe("normalizedRarity", () => {
  test("normalises 5/249 to a 1-in-N form", () => {
    expect(normalizedRarity(5, 249)).toBe("1/49.8");
  });
  test("keeps whole 1/N and rounds large denominators", () => {
    expect(normalizedRarity(1, 1024)).toBe("1/1,024");
    expect(normalizedRarity(10, 249)).toBe("1/24.9");
  });
  test("always for num >= denom", () => {
    expect(normalizedRarity(1, 1)).toBe("Always");
  });
});

describe("perKillChance", () => {
  test("single roll equals the raw probability", () => {
    expect(perKillChance(1, 100, 1)).toBeCloseTo(1, 6);
  });
  test("multiple rolls raise the per-kill chance", () => {
    expect(perKillChance(1, 100, 2)).toBeCloseTo(1.99, 2);
  });
});

describe("formatChance", () => {
  test("scales precision to magnitude", () => {
    expect(formatChance(0)).toBe("-");
    expect(formatChance(0.02)).toBe("0.020%");
    expect(formatChance(45.2)).toBe("45.2%");
  });
});

describe("label helpers", () => {
  test("numeric rarity yields normalized rarity and a chance", () => {
    const d = drop({ rarity_num: 1, rarity_denom: 128, rolls: 1 });
    expect(rarityLabel(d)).toBe("1/128");
    expect(chanceLabel(d)).toBe("0.78%");
  });
  test("qualitative rarity falls back to text with no chance", () => {
    const d = drop({ rarity_text: "Common" });
    expect(rarityLabel(d)).toBe("Common");
    expect(chanceLabel(d)).toBe("-");
  });
});
