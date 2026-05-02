import type { JSX, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import type { RegisteredPage } from "@/types/permissions";

export type { PermAction, PagePermissionConfig, RegisteredPage } from "@/types/permissions";

const _registry = new Map<string, RegisteredPage>();

/** Called once per route module (at import time) to register the page. */
export function registerPage(config: RegisteredPage): void {
  _registry.set(config.id, config);
}

/** Returns all registered pages, sorted by id. */
export function getPageRegistry(): RegisteredPage[] {
  return Array.from(_registry.values()).sort((a, b) => a.id.localeCompare(b.id));
}

/** Renders children only if the authenticated user is logged in. */
export function RequireAuth({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Access denied - please log in.
      </div>
    ) as JSX.Element;
  }

  return children as JSX.Element;
}
