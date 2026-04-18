import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { DISCORD_ROLE_ORDER } from "@/lib/ranks";

// ── Page permission registry ──────────────────────────────────────────────────

export type PermAction = "read" | "edit" | "delete";

export interface PagePermissionConfig {
  read: string[];
  edit: string[];
  delete: string[];
}

export interface RegisteredPage {
  id: string;
  label: string;
  description?: string;
  /** Defaults used when no DB config exists for this page. */
  defaults: PagePermissionConfig;
}

const _registry = new Map<string, RegisteredPage>();

/** Called once per route module (at import time) to register the page. */
export function registerPage(config: RegisteredPage): void {
  _registry.set(config.id, config);
}

/** Returns all registered pages, sorted by id. */
export function getPageRegistry(): RegisteredPage[] {
  return Array.from(_registry.values()).sort((a, b) => a.id.localeCompare(b.id));
}

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

  if (!user || !hasMinRank(user.effective_roles, rank)) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Access denied - requires role <strong>{rank}</strong> or higher.
      </div>
    ) as JSX.Element;
  }

  return children as JSX.Element;
}
