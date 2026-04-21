export const INGAME_TO_DISPLAY: Record<string, string> = {
  "Guest":       "Guest",
  "Achiever":    "Achiever",
  "Sapphire":    "Sapphire",
  "Emerald":     "Emerald",
  "Ruby":        "Ruby",
  "Diamond":     "Diamond",
  "Dragonstone": "Dragonstone",
  "Onyx":        "Onyx",
  "Zenyte":      "Zenyte",
  "Myth":          "Foundry Mentors",
  "Legend":        "Event Team",
  "Captain":       "Moderator",
  "General":       "Senior Moderator",
  "Deputy Owner":  "Co-owner",
  "Owner":         "Co-owner",
  "Legacy":      "Ex-Moderator",
};

export type RankCategory = "progression" | "staff" | "legacy" | "fun";

const PROGRESSION = new Set([
  "Guest", "Achiever", "Sapphire", "Emerald", "Ruby",
  "Diamond", "Dragonstone", "Onyx", "Zenyte",
]);
const STAFF = new Set(["Myth", "Legend", "Captain", "General", "Deputy Owner", "Owner"]);

export function getRankCategory(ingameRank: string): RankCategory {
  if (PROGRESSION.has(ingameRank)) return "progression";
  if (STAFF.has(ingameRank)) return "staff";
  if (ingameRank === "Legacy") return "legacy";
  return "fun";
}

export function getDisplayRank(ingameRank: string | null): string | null {
  if (!ingameRank) return null;
  return INGAME_TO_DISPLAY[ingameRank] ?? `${ingameRank} (fun rank)`;
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
