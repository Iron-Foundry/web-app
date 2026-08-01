import { getEffectiveTileIcon } from "@/lib/tilerace";
import { describeModifier } from "@/lib/tilerace-modifiers";
import type { BoardCell, RequirementNode } from "@/types/tilerace";

/** What a cell draws in its body, and where that came from. */
export interface CellPresentation {
  source: "tile" | "trap" | "none";
  iconUrl: string | null;
  title: string | null;
  description: string | null;
  requirement: RequirementNode | null;
}

const EMPTY: CellPresentation = {
  source: "none",
  iconUrl: null,
  title: null,
  description: null,
  requirement: null,
};

/**
 * A trap carries no repository tile, so it draws itself like one - icon, title
 * and hover text - instead of a corner modifier badge. An assigned tile always
 * wins the body, and the trap then falls back to its badge.
 */
export function getCellPresentation(cell: BoardCell | undefined): CellPresentation {
  const tile = cell?.tile ?? null;
  if (tile) {
    return {
      source: "tile",
      iconUrl: getEffectiveTileIcon(tile),
      title: tile.title,
      description: tile.description,
      requirement: tile.requirement,
    };
  }
  const trap = (cell?.modifiers ?? []).find((m) => m.type === "trap");
  if (!trap) return EMPTY;
  const info = describeModifier(trap);
  return {
    source: "trap",
    iconUrl: info.iconUrl ?? null,
    title: info.label,
    description: info.summary,
    requirement: null,
  };
}
