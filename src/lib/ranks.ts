export const ROLE_BADGE_CLASS: Record<string, string> = {
  "Co-owner":         "border-amber-500/60   text-amber-600   dark:text-amber-400",
  "Deputy Owner":     "border-amber-500/60   text-amber-600   dark:text-amber-400",
  "Senior Moderator": "border-red-400/60     text-red-600     dark:text-red-400",
  "Moderator":        "border-orange-400/60  text-orange-600  dark:text-orange-400",
  "Event Team":       "border-green-500/60   text-green-700   dark:text-green-400",
  "Foundry Mentors":  "border-blue-400/60    text-blue-600    dark:text-blue-400",
};

export const INGAME_TO_DISPLAY: Record<string, string> = {
  "guest":        "Guest",
  "achiever":     "Achiever",
  "sapphire":     "Sapphire",
  "emerald":      "Emerald",
  "ruby":         "Ruby",
  "diamond":      "Diamond",
  "dragonstone":  "Dragonstone",
  "onyx":         "Onyx",
  "zenyte":       "Zenyte",
  "myth":         "Foundry Mentors",
  "legend":       "Event Team",
  "captain":      "Moderator",
  "general":      "Senior Moderator",
  "deputy_owner": "Co-owner",
  "owner":        "Co-owner",
  "legacy":       "Ex-Moderator",
};

type RankCategory = "progression" | "staff" | "legacy" | "fun";

const PROGRESSION = new Set([
  "guest", "achiever", "sapphire", "emerald", "ruby",
  "diamond", "dragonstone", "onyx", "zenyte",
]);
const STAFF = new Set(["myth", "legend", "captain", "general", "deputy_owner", "owner"]);

function getRankCategory(ingameRank: string): RankCategory {
  if (PROGRESSION.has(ingameRank)) return "progression";
  if (STAFF.has(ingameRank)) return "staff";
  if (ingameRank === "legacy") return "legacy";
  return "fun";
}

export function getDisplayRank(ingameRank: string | null): string | null {
  if (!ingameRank) return null;
  return INGAME_TO_DISPLAY[ingameRank] ?? ingameRank;
}

/**
 * Ordered list of Discord role names for display purposes (badge CSS, highestRole sorting).
 * NOTE: This list is display-only. Authorization uses role IDs from the DB, not this list.
 */
export const DISCORD_ROLE_ORDER = [
  "Guest",
  "Achiever",
  "Sapphire",
  "Emerald",
  "Ruby",
  "Diamond",
  "Dragonstone",
  "Onyx",
  "Zenyte",
  "Ex-Moderator",
  "Foundry Mentors",
  "Event Team",
  "Moderator",
  "Senior Moderator",
  "Deputy Owner",
  "Co-owner",
] as const;

export type DiscordRole = (typeof DISCORD_ROLE_ORDER)[number];

/**
 * Highest-privilege role the user holds (by name), or null.
 * Works with legacy name-based effective_roles arrays.
 */
export function highestRole(discordRoles: string[] | null | undefined): DiscordRole | null {
  if (!discordRoles) return null;
  let best = -1;
  let bestRole: DiscordRole | null = null;
  for (const role of discordRoles) {
    const idx = DISCORD_ROLE_ORDER.indexOf(role as DiscordRole);
    if (idx > best) {
      best = idx;
      bestRole = role as DiscordRole;
    }
  }
  return bestRole;
}

/**
 * Resolve role IDs to labels using roleLabels map, then return the highest-privilege label.
 * Use this when effective_roles contains Discord snowflake IDs (new format).
 */
export function highestRoleDisplay(
  effectiveRoles: string[],
  roleLabels: Record<string, string>,
): DiscordRole | null {
  const names = effectiveRoles.map((id) => roleLabels[id] ?? id);
  return highestRole(names);
}
