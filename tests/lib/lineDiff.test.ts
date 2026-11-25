import { describe, expect, test } from "bun:test";
import { diffLines } from "@/lib/lineDiff";

describe("diffLines", () => {
  test("a changed line shows the old and the new side", () => {
    expect(diffLines(["a", "points: 60", "c"], ["a", "points: 55", "c"])).toEqual([
      { kind: "same", text: "a" },
      { kind: "old", text: "points: 60" },
      { kind: "new", text: "points: 55" },
      { kind: "same", text: "c" },
    ]);
  });

  test("added and removed tails keep their side", () => {
    expect(diffLines(["a", "b"], ["a", "c", "d"]).map((l) => l.kind)).toEqual(["same", "old", "new", "new"]);
  });
});
