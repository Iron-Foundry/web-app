import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useViewAs } from "@/context/ViewAsContext";
import { permissionsApi } from "@/api/permissions";
import { queryKeys } from "@/lib/queryKeys";
import type { PagePermissionConfig, PermAction } from "@/types/permissions";

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
  // Bypass roles override ALL actions — bypass users can never be locked out.
  if (adminBypassRoles.length > 0 && effectiveRoles.some((r) => adminBypassRoles.includes(r))) {
    return true;
  }

  const config = pagePermissions[pageId];
  const allowed: string[] = config?.[action] ?? [];

  if (action === "read" && allowed.length === 0) return true;
  if (allowed.length === 0) return false;

  return effectiveRoles.some((r) => allowed.includes(r));
}

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { overrideRoles } = useViewAs();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.permissions.config(),
    queryFn: permissionsApi.getPagePermissions,
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const pagePermissions: PagePermissionsMap = data?.pages ?? {};
  const adminBypassRoles: string[] = data?.admin_bypass_roles ?? [];

  const hasPermission = (pageId: string, action: PermAction, effectiveRoles: string[]) => {
    const roles = overrideRoles ?? effectiveRoles;
    return checkPermission(pageId, action, roles, pagePermissions, adminBypassRoles);
  };

  return (
    <PermissionsContext.Provider value={{ pagePermissions, adminBypassRoles, hasPermission, loading: isLoading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}
