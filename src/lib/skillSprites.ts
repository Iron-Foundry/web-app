import { spriteImageUrl } from "@/api/osrsAssets";

// OSRS skill stat icons are the sprites of the "Staticons" category.
const STATICON_ID: Record<string, number> = {
  attack: 197,
  strength: 198,
  defence: 199,
  ranged: 200,
  prayer: 201,
  magic: 202,
  hitpoints: 203,
  agility: 204,
  herblore: 205,
  thieving: 206,
  crafting: 207,
  fletching: 208,
  mining: 209,
  smithing: 210,
  fishing: 211,
  cooking: 212,
  firemaking: 213,
  woodcutting: 214,
  runecraft: 215,
  slayer: 216,
  farming: 217,
  hunter: 220,
  construction: 221,
  sailing: 228,
};

/**
 * Resolves a skill (key or wiki slug, any case) to its OSRSClans sprite image.
 * Returns an empty string for an unknown skill.
 */
export function skillSpriteUrl(skill: string): string {
  const key = skill.trim().toLowerCase().replace(/^runecrafting$/, "runecraft");
  const id = STATICON_ID[key];
  return id ? spriteImageUrl(id, 0) : "";
}
