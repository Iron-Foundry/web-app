import { createContext, useContext, useEffect, useState } from "react";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { useViewAs } from "@/context/ViewAsContext";
import type { PagePermissionConfig, PermAction } from "@/lib/permissions";
import { fetchCached } from "@/lib/cache";

type PagePermissionsMap = Record<string, PagePermissionConfig>;

interface PermissionsContextValue {
  /** Raw DB config: pageId -> { read, create, edit, delete } */
  pagePermissions: PagePermissionsMap;
  /** Role IDs that bypass all non-read permission checks. */
  adminBypassRoles: string[];
  /**
   * Returns true if the user (identified by effectiveRoles) can perform the
   * given action on the given page.
   *
   * Rules:
   * - "read" with empty allowed list -> open to all authenticated users.
   * - "create"/"edit"/"delete" with empty allowed list -> denied (bypass roles excepted).
   * - If the user holds any role in the bypass list -> granted for non-read.
   * - If the user holds any role in the allowed list -> granted.
   */
  hasPermission: (pageId: string, action: PermAction, effectiveRoles: string[]) => boolean;
  /** True while the initial config fetch is in flight. */
  loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  pagePermissions: {},
  adminBypassRoles: [],
  hasPermission: () => true,
  loading: true,
});

function checkPermission(
  pageId: string,
  action: PermAction,
  effectiveRoles: string[],
  pagePermissions: PagePermissionsMap,
  adminBypassRoles: string[],
): boolean {
  const config = pagePermissions[pageId];
  const allowed: string[] = config?.[action] ?? [];

  if (action === "read" && allowed.length === 0) return true;

  if (action !== "read" && effectiveRoles.some((r) => adminBypassRoles.includes(r))) {
    return true;
  }

  if (allowed.length === 0) return false;

  return effectiveRoles.some((r) => allowed.includes(r));
}

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { overrideRoles } = useViewAs();
  const [pagePermissions, setPagePermissions] = useState<PagePermissionsMap>({});
  const [adminBypassRoles, setAdminBypassRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetchCached<{ pages: PagePermissionsMap; admin_bypass_roles: string[] }>(
      `${API_URL}/config/page-permissions`,
      { headers, cacheKey: "config:page-permissions", ttl: 10 * 60 * 1000 },
    )
      .then((data) => {
        setPagePermissions(data.pages ?? {});
        setAdminBypassRoles(data.admin_bypass_roles ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const hasPermission = (pageId: string, action: PermAction, effectiveRoles: string[]) => {
    // Use view-as override roles if active
    const roles = overrideRoles ?? effectiveRoles;
    return checkPermission(pageId, action, roles, pagePermissions, adminBypassRoles);
  };

  return (
    <PermissionsContext.Provider value={{ pagePermissions, adminBypassRoles, hasPermission, loading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}
