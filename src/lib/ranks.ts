// ---------------------------------------------------------------------------
// Rank mapping — in-game OSRS clan rank → community display name
// ---------------------------------------------------------------------------

export const INGAME_TO_DISPLAY: Record<string, string> = {
  // Progression ranks (ingame name = display name)
  "Guest":       "Guest",
  "Achiever":    "Achiever",
  "Sapphire":    "Sapphire",
  "Emerald":     "Emerald",
  "Ruby":        "Ruby",
  "Diamond":     "Diamond",
  "Dragonstone": "Dragonstone",
  "Onyx":        "Onyx",
  "Zenyte":      "Zenyte",
  // Staff ranks (ingame name differs from display name)
  "Myth":          "Mentor",
  "Legend":        "Event Team",
  "Captain":       "Moderator",
  "General":       "Senior Moderator",
  "Deputy Owner":  "Co-owner",
  "Owner":         "Co-owner",
  // Legacy
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

// ---------------------------------------------------------------------------
// Discord role privilege order — used for permission checks
// Permissions are derived from Discord roles, NOT ingame clan_rank.
// ---------------------------------------------------------------------------

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
  "Mentor",
  "Event Team",
  "Moderator",
  "Senior Moderator",
  "Deputy Owner",
  "Co-owner",
] as const;

export type DiscordRole = (typeof DISCORD_ROLE_ORDER)[number];

/** True if the user holds at least minRole. */
export function hasMinRank(discordRoles: string[], minRole: string): boolean {
  const minIdx = DISCORD_ROLE_ORDER.indexOf(minRole as DiscordRole);
  if (minIdx === -1) return false;
  for (const role of discordRoles) {
    const idx = DISCORD_ROLE_ORDER.indexOf(role as DiscordRole);
    if (idx >= minIdx) return true;
  }
  return false;
}

/** Highest-privilege role the user holds, or null. */
export function highestRole(discordRoles: string[]): DiscordRole | null {
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
