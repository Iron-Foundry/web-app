import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { filterPool, gridRounds, pickAt, recentPicks, snakeSlot } from "@/lib/frenzyDraft";
import type { DraftMember, DraftView } from "@/types/frenzyDraft";

const FIXTURE = join(import.meta.dir, "../../../fixtures/frenzy_snake.json");

const member = (rsn: string, pick: number | null, rank: string | null = "Ruby"): DraftMember => ({
  signup_id: pick ?? 0,
  rsn,
  timezone: null,
  rank,
  points: 100,
  wants_captain: false,
  pick_number: pick,
  pick_kind: pick === null ? null : "drafted",
});

const view = (members: DraftMember[][], pool: DraftMember[] = []): DraftView => ({
  event_id: 1,
  mode: "full",
  top_picks: 5,
  state: "picking",
  next_pick: 1,
  picking_team_id: null,
  captains: [],
  teams: members.map((m, i) => ({
    team_id: i + 1,
    name: `T${i}`,
    captain: member(`Cap ${i}`, null),
    captain_discord_user_id: String(i),
    members: m,
  })),
  pool,
});

describe("snakeSlot", () => {
  test.skipIf(!existsSync(FIXTURE))("matches the API's shared fixture", () => {
    const { cases } = JSON.parse(readFileSync(FIXTURE, "utf8")) as { cases: { team_count: number; slots: number[] }[] };
    for (const { team_count, slots } of cases) {
      expect(slots.map((_, i) => snakeSlot(i + 1, team_count))).toEqual(slots);
    }
  });

  test("pickAt inverts the slot of each grid cell", () => {
    expect([1, 2, 3].map((round) => pickAt(round, 0, 3))).toEqual([1, 6, 7]);
  });
});

describe("recentPicks", () => {
  test("lists the newest picks first with their captain", () => {
    const recent = recentPicks(view([[member("A", 1), member("D", 4)], [member("B", 2), member("C", 3)]]), 2);
    expect(recent).toEqual([
      { pick: 4, round: 2, captain: "Cap 0", rsn: "D" },
      { pick: 3, round: 2, captain: "Cap 1", rsn: "C" },
    ]);
  });
});

describe("gridRounds", () => {
  test("a full draft draws a round per team slot left", () => {
    expect(gridRounds(view([[member("A", 1)], []], [member("B", null), member("C", null)]))).toBe(2);
  });
});

describe("filterPool", () => {
  test("matches the search and the rank together", () => {
    const pool = [member("Iron Lung", null), member("Iron Fist", null, "Onyx"), member("Slag", null)];
    expect(filterPool(pool, "iron", "Ruby").map((m) => m.rsn)).toEqual(["Iron Lung"]);
  });
});
