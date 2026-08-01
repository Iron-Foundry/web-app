import { describe, expect, test } from "bun:test";
import { buildProgressMarkers, getMaxPathPosition } from "@/lib/tilerace-progress";
import type { BoardCell, TileRaceTeam } from "@/types/tilerace";

function cell(pathPosition: number | null): BoardCell {
  return { cell_x: 0, cell_y: 0, path_position: pathPosition, tile_id: null };
}

function team(name: string, position: number): TileRaceTeam {
  return {
    id: name,
    name,
    slug: name.toLowerCase(),
    icon_type: "item",
    icon_url: "",
    color: "hsl(0,0%,50%)",
    position,
    furthest_position: position,
    discord_role_id: null,
    discord_text_channel_id: null,
    discord_voice_channel_id: null,
    members: [],
  };
}

const BOARD: BoardCell[] = [cell(0), cell(5), cell(10), cell(null)];

describe("getMaxPathPosition", () => {
  test("ignores cells that are not on the path", () => {
    expect(getMaxPathPosition(BOARD)).toBe(10);
  });

  test("an unmapped board has no length", () => {
    expect(getMaxPathPosition([cell(null)])).toBe(0);
  });
});

describe("buildProgressMarkers", () => {
  test("maps a team's step onto the track", () => {
    const [marker] = buildProgressMarkers(BOARD, [team("Ardy", 5)]);

    expect(marker?.percent).toBe(50);
    expect(marker?.step).toBe(5);
    expect(marker?.totalSteps).toBe(10);
    expect(marker?.offset).toBe(0);
  });

  test("clamps a position past the finish and below the start", () => {
    const markers = buildProgressMarkers(BOARD, [team("Over", 99), team("Under", -4)]);

    expect(markers.map((m) => m.percent)).toEqual([0, 100]);
    expect(markers.map((m) => m.step)).toEqual([0, 10]);
  });

  test("an unmapped board leaves every team at zero", () => {
    const markers = buildProgressMarkers([cell(null)], [team("Ardy", 7)]);

    expect(markers[0]?.percent).toBe(0);
    expect(markers[0]?.totalSteps).toBe(0);
  });

  test("teams sharing a step are spread symmetrically around it", () => {
    const markers = buildProgressMarkers(BOARD, [
      team("A", 5),
      team("B", 5),
      team("C", 5),
    ]);

    expect(markers.map((m) => m.percent)).toEqual([50, 50, 50]);
    expect(markers.map((m) => m.offset)).toEqual([-26, 0, 26]);
  });

  test("teams far apart are not nudged", () => {
    const markers = buildProgressMarkers(BOARD, [team("Front", 10), team("Back", 0)]);

    expect(markers.map((m) => m.team.name)).toEqual(["Back", "Front"]);
    expect(markers.map((m) => m.offset)).toEqual([0, 0]);
  });

  test("no teams means no markers", () => {
    expect(buildProgressMarkers(BOARD, [])).toEqual([]);
  });
});
