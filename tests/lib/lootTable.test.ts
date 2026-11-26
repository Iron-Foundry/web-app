import { describe, expect, test } from "bun:test";
import { formatChance, groupRows, parseKillsPerHour, quantityLabel, sourceLabel } from "@/lib/lootTable";

describe("parseKillsPerHour", () => {
  test.each([
    ["6.5", 6.5],
    [" 12 ", 12],
    ["100000", 100_000],
    ["0", null],
    ["-3", null],
    ["100001", null],
    ["", null],
    ["fast", null],
  ])("%p reads as %p", (text, rate) => {
    expect(parseKillsPerHour(text)).toBe(rate);
  });
});

describe("formatChance", () => {
  test.each([
    [0, "-"],
    [0.02, "0.020%"],
    [0.5, "0.50%"],
    [45.2, "45.2%"],
    [100, "100%"],
  ])("%p percent reads %p", (pct, label) => {
    expect(formatChance(pct)).toBe(label);
  });
});

test("source label joins the section with a comma", () => {
  expect(sourceLabel("Vorkath#Post-quest")).toBe("Vorkath, Post-quest");
  expect(sourceLabel("Herbiboar")).toBe("Herbiboar");
});

describe("quantityLabel", () => {
  const line = { rarity: "1/64", alt_rarity: null, rolls: 1, approximate: false, group: null };
  test.each([
    [{ quantity: "1", quantity_low: 1, quantity_high: 1, noted: false }, "1"],
    [{ quantity: "100-299", quantity_low: 100, quantity_high: 299, noted: true }, "100-299 (noted)"],
    [{ quantity: "N/A", quantity_low: null, quantity_high: null, noted: false }, "N/A"],
  ])("%p reads %p", (quantity, label) => {
    expect(quantityLabel({ ...line, ...quantity })).toBe(label);
  });
});

test("rows group under their heading in first-seen order", () => {
  const rows = [{ group: "Uniques" }, { group: null }, { group: "Uniques" }];
  expect(groupRows(rows).map(([group, members]) => [group, members.length])).toEqual([
    ["Uniques", 2],
    ["Drops", 1],
  ]);
});
