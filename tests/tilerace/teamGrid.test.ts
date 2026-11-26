import { expect, test } from "bun:test";
import { isGated } from "@/components/tilerace/TeamGrid";
import type { TileCompletion } from "@/types/tilerace";

const completion = (status: string, position = 4): TileCompletion =>
  ({ team_id: "t1", path_position: position, status }) as unknown as TileCompletion;

test.each([
  ["no tile", null, [], false],
  ["tile without a claim", "tile-a", [], true],
  ["tile claimed", "tile-a", [completion("claimed")], false],
  ["tile approved", "tile-a", [completion("approved")], false],
  ["tile rejected", "tile-a", [completion("rejected")], true],
  ["claim on another square", "tile-a", [completion("claimed", 5)], true],
] as const)("isGated: %s", (_case, tileId, completions, gated) => {
  expect(isGated("t1", 4, tileId, [...completions])).toBe(gated);
});
