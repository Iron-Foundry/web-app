import { describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
import type { PlayerSnapshot } from "@/types/members";

let snapshot: PlayerSnapshot | undefined;

mock.module("@/hooks/useMemberDashboard", () => ({
  useMySnapshot: () => ({ data: snapshot }),
}));

const { WomSnapshotCard } = await import("@/components/profile/WomSnapshotCard");

function makeSnapshot(overrides: Partial<PlayerSnapshot> = {}): PlayerSnapshot {
  return {
    rsn: "Some Player",
    skills: { overall: 346_368_000, slayer: 122_400_000, ranged: 98_100_000, hitpoints: 91_700_000, attack: 40 },
    bosses: { zulrah: 1204, vorkath: 918 },
    activities: {},
    ehp: 5340.50991,
    ehb: 1321.98815,
    fetched_at: "2026-07-31T00:00:00+00:00",
    ...overrides,
  };
}

describe("WomSnapshotCard", () => {
  test("renders overall xp, the top three skills and ironman efficiency", () => {
    snapshot = makeSnapshot();
    const { getByText, queryByText } = render(<WomSnapshotCard rsn="Some Player" />);

    expect(getByText("Overall XP")).toBeDefined();
    expect(getByText("346.4M")).toBeDefined();
    expect(getByText("Slayer")).toBeDefined();
    expect(getByText("Ranged")).toBeDefined();
    expect(getByText("Hitpoints")).toBeDefined();
    expect(queryByText("Attack")).toBeNull();
    expect(getByText("Ironman EHP")).toBeDefined();
    expect(getByText((5340.50991).toLocaleString(undefined, { maximumFractionDigits: 1 }))).toBeDefined();
    expect(getByText("Ironman EHB")).toBeDefined();
    expect(getByText((1321.98815).toLocaleString(undefined, { maximumFractionDigits: 1 }))).toBeDefined();
  });

  test("omits the overall entry from the skill list", () => {
    snapshot = makeSnapshot({ skills: { overall: 500, slayer: 400 } });
    const { queryByText } = render(<WomSnapshotCard rsn="Some Player" />);

    expect(queryByText("Overall")).toBeNull();
  });

  test("renders nothing when the snapshot is empty", () => {
    snapshot = makeSnapshot({ skills: {}, bosses: {}, ehp: null, ehb: null });
    const { container } = render(<WomSnapshotCard rsn="Some Player" />);

    expect(container.innerHTML).toBe("");
  });
});
