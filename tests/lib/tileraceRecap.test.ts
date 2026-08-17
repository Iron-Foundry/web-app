import { describe, expect, test } from "bun:test";
import {
  approvalRate,
  buildContributors,
  buildCumulativeRows,
  buildDailyRows,
  buildPositionRows,
  formatRecapDay,
} from "@/lib/tilerace-recap";
import type { TileRaceRecapTeam } from "@/types/tilerace";

function team(overrides: Partial<TileRaceRecapTeam>): TileRaceRecapTeam {
  return {
    id: "7",
    name: "Iron Kings",
    slug: "iron-kings",
    icon_type: "npc",
    icon_url: "",
    color: "#ef4444",
    position: 12,
    furthest_position: 12,
    tiles_cleared: 9,
    rolls: 11,
    submitted: 0,
    approved: 0,
    rejected: 0,
    unreviewed: 0,
    roster: [],
    position_series: [],
    submission_series: [],
    ...overrides,
  };
}

const REDS = team({
  position_series: [
    { at: "2026-07-02T10:00:00Z", position: 3 },
    { at: "2026-07-04T10:00:00Z", position: 9 },
  ],
  submission_series: [
    { day: "2026-07-02", approved: 2, rejected: 1, unreviewed: 0 },
    { day: "2026-07-04", approved: 3, rejected: 0, unreviewed: 1 },
  ],
});

const BLUES = team({
  id: "8",
  name: "Blue Vipers",
  slug: "blue-vipers",
  color: "#3b82f6",
  position_series: [{ at: "2026-07-03T10:00:00Z", position: 5 }],
  submission_series: [{ day: "2026-07-03", approved: 1, rejected: 0, unreviewed: 0 }],
});

describe("buildPositionRows", () => {
  test("a team holds its last position between its own rolls", () => {
    const rows = buildPositionRows([REDS, BLUES]);

    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r["iron-kings"])).toEqual([3, 3, 9]);
    expect(rows.map((r) => r["blue-vipers"])).toEqual([0, 5, 5]);
  });

  test("no rolls yields no rows", () => {
    expect(buildPositionRows([team({})])).toEqual([]);
  });
});

describe("buildCumulativeRows", () => {
  test("approved proofs accumulate across the days a team filed on", () => {
    const rows = buildCumulativeRows([REDS, BLUES]);

    expect(rows.map((r) => r["iron-kings"])).toEqual([2, 2, 5]);
    expect(rows.map((r) => r["blue-vipers"])).toEqual([0, 1, 1]);
  });

  test("rejected and unreviewed proofs never move the line", () => {
    const rows = buildCumulativeRows([
      team({
        submission_series: [{ day: "2026-07-02", approved: 0, rejected: 4, unreviewed: 2 }],
      }),
    ]);

    expect(rows[0]?.["iron-kings"]).toBe(0);
  });
});

describe("buildDailyRows", () => {
  test("every team's verdicts sum into one row per day, oldest first", () => {
    expect(buildDailyRows([REDS, BLUES])).toEqual([
      { day: "2026-07-02", approved: 2, rejected: 1, unreviewed: 0 },
      { day: "2026-07-03", approved: 1, rejected: 0, unreviewed: 0 },
      { day: "2026-07-04", approved: 3, rejected: 0, unreviewed: 1 },
    ]);
  });
});

describe("buildContributors", () => {
  const ROSTERED = team({
    approved: 10,
    roster: [
      { rsn: "Kaelith", is_captain: false, approved: 3, rejected: 1, tiles_proved: 3 },
      { rsn: "Zezima", is_captain: true, approved: 7, rejected: 0, tiles_proved: 5 },
    ],
  });

  test("best first, with each racer's share of their own team", () => {
    const [first, second] = buildContributors([ROSTERED]);

    expect(first?.rsn).toBe("Zezima");
    expect(first?.share).toBe(70);
    expect(second?.rsn).toBe("Kaelith");
    expect(second?.share).toBe(30);
  });

  test("a team with no approved proofs gives everyone a zero share", () => {
    const rows = buildContributors([
      team({
        approved: 0,
        roster: [
          { rsn: "Vex", is_captain: false, approved: 0, rejected: 2, tiles_proved: 0 },
        ],
      }),
    ]);

    expect(rows[0]?.share).toBe(0);
  });
});

describe("approvalRate", () => {
  test("counts only reviewed proofs", () => {
    expect(approvalRate(team({ approved: 3, rejected: 1, unreviewed: 6 }))).toBe(75);
  });

  test("an unreviewed-only team is not a division by zero", () => {
    expect(approvalRate(team({ approved: 0, rejected: 0, unreviewed: 4 }))).toBe(0);
  });
});

describe("formatRecapDay", () => {
  test("a day bucket keeps its own date regardless of viewer timezone", () => {
    expect(formatRecapDay("2026-07-02")).toBe("2 Jul");
  });
});
