import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { assignItemPoints, POINT_CAP, roundHalfUp } from "@/lib/frenzyPoints";
import type { FrenzyTierData } from "@/types/frenzyTemplate";

const FIXTURE = join(import.meta.dir, "../../../fixtures/frenzy_points.json");

interface Fixture {
  point_cap: number;
  cases: { tiers: Record<string, FrenzyTierData>; points: number[] }[];
}

function pointsOf(tiers: Record<string, FrenzyTierData>): number[] {
  return Object.values(tiers).flatMap((t) => t.sources.flatMap((s) => s.items.map((i) => i.points)));
}

describe("assignItemPoints", () => {
  test.skipIf(!existsSync(FIXTURE))("matches the API's shared fixture", () => {
    const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as Fixture;
    expect(fixture.point_cap).toBe(POINT_CAP);
    for (const c of fixture.cases) expect(pointsOf(assignItemPoints(c.tiers))).toEqual(c.points);
  });
});

describe("roundHalfUp", () => {
  test.each([
    [0.5, 1],
    [2.5, 3],
    [2.49, 2],
  ])("%p rounds to %p", (value, expected) => {
    expect(roundHalfUp(value)).toBe(expected);
  });
});
