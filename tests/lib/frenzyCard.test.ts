import { describe, expect, test } from "bun:test";
import { cardState, isTypedCard, itemState, movedTier, orderedTiers } from "@/lib/frenzyCard";
import type { FrenzyItem, FrenzySource } from "@/types/frenzyTemplate";

function item(partial: Partial<FrenzyItem>): FrenzyItem {
  return {
    name: "Tanzanite fang",
    points: 40,
    required: 1,
    duplicate_required: 1,
    icon_url: null,
    drop_denom: 512,
    kph: 46,
    ...partial,
  };
}

describe("itemState", () => {
  test.each([
    [0, "none"],
    [1, "base"],
    [2, "full"],
    [3, "full"],
  ] as const)("one plus one duplicate at %i obtained is %s", (obtained, state) => {
    expect(itemState(item({}), obtained)).toBe(state);
  });

  test("no duplicate is full at the base count", () => {
    expect(itemState(item({ duplicate_required: 0 }), 1)).toBe("full");
  });
});

describe("cardState", () => {
  test.each([
    [["full", "full"], "full"],
    [["full", "base"], "base"],
    [["base", "none"], "none"],
    [[], "none"],
  ] as const)("%j gives %s", (states, state) => {
    expect(cardState([...states])).toBe(state);
  });
});

describe("isTypedCard", () => {
  function card(name: string, sources: (string | null)[]): FrenzySource {
    return { name, hovertext: "", icon_url: "", items: sources.map((s) => item({ rate_source: s })) };
  }

  test("a card named after its rate source is not typed", () => {
    expect(isTypedCard(card("Vorkath", ["Vorkath#Post-quest", null]))).toBe(false);
  });

  test("a card grouping other sources is typed", () => {
    expect(isTypedCard(card("Slayer", ["Kraken", "Abyssal demon#Standard"]))).toBe(true);
  });
});

describe("orderedTiers", () => {
  test("follows order, and a tier with none keeps its place", () => {
    const tiers = { Hard: { order: 2 }, Easy: { order: 0 }, Elite: {}, Medium: { order: 1 } };
    expect(orderedTiers(tiers).map(([name]) => name)).toEqual(["Easy", "Medium", "Hard", "Elite"]);
  });
});

describe("movedTier", () => {
  test.each([
    ["Medium", -1, ["Medium", "Easy", "Hard"]],
    ["Medium", 1, ["Easy", "Hard", "Medium"]],
    ["Easy", -1, ["Easy", "Medium", "Hard"]],
  ] as const)("%s by %i", (name, step, expected) => {
    expect(movedTier(["Easy", "Medium", "Hard"], name, step)).toEqual([...expected]);
  });
});
