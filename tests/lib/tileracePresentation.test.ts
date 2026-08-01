import { describe, expect, test } from "bun:test";
import { API_URL } from "@/context/AuthContext";
import { getCellPresentation } from "@/lib/tilerace-presentation";
import type { BoardCell, RepositoryTile } from "@/types/tilerace";

function cell(overrides: Partial<BoardCell>): BoardCell {
  return {
    cell_x: 0,
    cell_y: 0,
    path_position: 12,
    tile_id: null,
    ...overrides,
  };
}

const TILE: RepositoryTile = {
  id: "204",
  title: "Bandos armour",
  description: "Any two pieces from General Graardor.",
  icon_url: "https://utfs.io/f/bandos.webp",
  icon_source: "external",
  items: [],
  requirement: null,
  tags: [],
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
};

describe("getCellPresentation", () => {
  test("a trap draws like a tile, with the cache service icon", () => {
    const shown = getCellPresentation(
      cell({ modifiers: [{ type: "trap", dice_count: 2, dice_sides: 6 }] }),
    );

    expect(shown.source).toBe("trap");
    expect(shown.title).toBe("Trap");
    expect(shown.iconUrl).toBe(`${API_URL}/osrs-cache/item-icons/8144`);
    expect(shown.description).toContain("2d6");
    expect(shown.requirement).toBeNull();
  });

  test("an assigned tile keeps the body and leaves the trap its badge", () => {
    const shown = getCellPresentation(
      cell({
        tile_id: "204",
        tile: TILE,
        modifiers: [{ type: "trap", dice_count: 1, dice_sides: 6 }],
      }),
    );

    expect(shown.source).toBe("tile");
    expect(shown.title).toBe("Bandos armour");
  });

  test("other modifiers never take over the body", () => {
    const shown = getCellPresentation(
      cell({ modifiers: [{ type: "fog", radius: 2 }] }),
    );

    expect(shown.source).toBe("none");
    expect(shown.iconUrl).toBeNull();
    expect(shown.title).toBeNull();
  });

  test("an empty cell shows nothing", () => {
    expect(getCellPresentation(cell({})).source).toBe("none");
    expect(getCellPresentation(undefined).source).toBe("none");
  });
});
