import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { DISCORD_ROLE_ORDER } from "@/lib/ranks";

/**
 * Returns true if `discordRoles` contains at least one role at or above
 * `minRole` in the privilege hierarchy.
 * Permissions are always based on Discord roles, never the raw ingame clan_rank.
 */
export function hasMinRank(discordRoles: string[], minRole: string): boolean {
  const minIdx = DISCORD_ROLE_ORDER.indexOf(minRole as (typeof DISCORD_ROLE_ORDER)[number]);
  if (minIdx === -1) return false;
  return discordRoles.some((role) => {
    const idx = DISCORD_ROLE_ORDER.indexOf(role as (typeof DISCORD_ROLE_ORDER)[number]);
    return idx !== -1 && idx >= minIdx;
  });
}

/** Renders children only if the authenticated user meets `minRole`. */
export function RequireRank({
  rank,
  children,
}: {
  rank: string;
  children: ReactNode;
}): JSX.Element {
  const { user } = useAuth();

  if (!user || !hasMinRank(user.discord_roles, rank)) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Access denied — requires role <strong>{rank}</strong> or higher.
      </div>
    ) as JSX.Element;
  }

  return children as JSX.Element;
}
