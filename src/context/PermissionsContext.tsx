import { createContext, useContext, useEffect, useState } from "react";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import type { PagePermissionConfig, PermAction } from "@/lib/permissions";

// ── Types ─────────────────────────────────────────────────────────────────────

type PagePermissionsMap = Record<string, PagePermissionConfig>;

interface PermissionsContextValue {
  /** Raw DB config: pageId → { read, create, edit, delete } */
  pagePermissions: PagePermissionsMap;
  /**
   * Returns true if the user (identified by effectiveRoles) can perform the
   * given action on the given page.
   *
   * Rules:
   * - "read" with empty allowed list → open to all authenticated users.
   * - "create"/"edit"/"delete" with empty allowed list → denied (Senior Mod+ bypass).
   * - If the user holds any role in the allowed list → granted.
   * - Senior Moderator+ always bypass for create/edit/delete.
   */
  hasPermission: (pageId: string, action: PermAction, effectiveRoles: string[]) => boolean;
  /** True while the initial config fetch is in flight. */
  loading: boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

const PermissionsContext = createContext<PermissionsContextValue>({
  pagePermissions: {},
  hasPermission: () => true,
  loading: true,
});

const SENIOR_MOD_BYPASS = ["Senior Moderator", "Deputy Owner", "Co-owner"];

function checkPermission(
  pageId: string,
  action: PermAction,
  effectiveRoles: string[],
  pagePermissions: PagePermissionsMap,
): boolean {
  const config = pagePermissions[pageId];
  const allowed: string[] = config?.[action] ?? [];

  // Open read: empty allowed list means anyone can read
  if (action === "read" && allowed.length === 0) return true;

  // Senior Mod+ always bypass for create/edit/delete
  if (action !== "read" && effectiveRoles.some((r) => SENIOR_MOD_BYPASS.includes(r))) {
    return true;
  }

  if (allowed.length === 0) return false;

  return effectiveRoles.some((r) => allowed.includes(r));
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pagePermissions, setPagePermissions] = useState<PagePermissionsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_URL}/config/page-permissions`, { headers })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ pages: {} })))
      .then((data) => setPagePermissions(data.pages ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const hasPermission = (pageId: string, action: PermAction, effectiveRoles: string[]) =>
    checkPermission(pageId, action, effectiveRoles, pagePermissions);

  return (
    <PermissionsContext.Provider value={{ pagePermissions, hasPermission, loading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}
