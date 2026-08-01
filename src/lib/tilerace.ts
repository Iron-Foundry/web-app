import { itemIconUrl } from "@/components/runelite/bankTag";
import type {
  BoardCell,
  RepositoryTile,
  RequirementNode,
  TileItem,
  TileRacePublicTeam,
  TileTag,
} from "@/types/tilerace";

export const TILE_TAGS: TileTag[] = [
  "precheck",
  "pvm",
  "skilling",
  "minigames",
  "misc",
  "endgame",
  "midgame",
  "earlygame",
];

export const TEAM_COLORS = [
  "hsl(220,70%,55%)",
  "hsl(140,60%,45%)",
  "hsl(280,65%,60%)",
  "hsl(30,80%,55%)",
  "hsl(0,65%,55%)",
  "hsl(180,55%,45%)",
  "hsl(55,75%,50%)",
  "hsl(320,65%,60%)",
];

export function getPathCells(cells: BoardCell[]): BoardCell[] {
  return cells
    .filter((c) => c.path_position !== null)
    .sort((a, b) => (a.path_position ?? 0) - (b.path_position ?? 0));
}

export function getTileAtPosition(cells: BoardCell[], pos: number): BoardCell | undefined {
  return cells.find((c) => c.path_position === pos);
}

export function buildFogMask(teams: TileRacePublicTeam[]): number {
  if (teams.length === 0) return 0;
  return Math.max(...teams.map((t) => t.position));
}

export function isCellVisible(
  cell: BoardCell,
  maxVisible: number,
  fogEnabled: boolean,
): boolean {
  if (!fogEnabled) return true;
  if (cell.path_position === null) return true;
  return cell.path_position <= maxVisible;
}

export function collectRequirementItems(node: RequirementNode | null): TileItem[] {
  if (!node) return [];
  if (node.kind === "item") {
    return [
      {
        item_id: node.item_id,
        name: node.name,
        quantity: node.quantity,
        icon_url: node.icon_url,
      },
    ];
  }
  if (node.kind === "text") return [];
  if (node.kind === "not") return collectRequirementItems(node.child);
  return node.children.flatMap(collectRequirementItems);
}

export function getEffectiveTileIcon(tile: RepositoryTile): string | null {
  if (tile.icon_url) return tile.icon_url;
  const firstItem = tile.items[0];
  if (firstItem) return itemIconUrl(firstItem.item_id);
  const firstLeaf = collectRequirementItems(tile.requirement)[0];
  if (firstLeaf) return itemIconUrl(firstLeaf.item_id);
  return null;
}

export function buildCellMap(cells: BoardCell[]): Map<string, BoardCell> {
  const m = new Map<string, BoardCell>();
  for (const c of cells) m.set(`${c.cell_x},${c.cell_y}`, c);
  return m;
}

export function buildPathPositionMap(cells: BoardCell[]): Map<number, BoardCell> {
  const m = new Map<number, BoardCell>();
  for (const c of cells) {
    if (c.path_position !== null) m.set(c.path_position, c);
  }
  return m;
}

export function buildTeamsByCell(
  teams: TileRacePublicTeam[],
  pathPositionMap: Map<number, BoardCell>,
): Map<string, TileRacePublicTeam[]> {
  const m = new Map<string, TileRacePublicTeam[]>();
  for (const team of teams) {
    const cell = pathPositionMap.get(team.position);
    if (!cell) continue;
    const key = `${cell.cell_x},${cell.cell_y}`;
    m.set(key, [...(m.get(key) ?? []), team]);
  }
  return m;
}

export function formatTileRaceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
