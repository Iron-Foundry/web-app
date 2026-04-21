import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";

/**
 * Redirects to /members/staff if the current effective roles (respecting
 * the ViewAs preview selection) do not have read permission on `pageId`.
 */
export function StaffGuard({ pageId, children }: { pageId: string; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const navigate = useNavigate();

  const allowed = !loading && !!user && hasPermission(pageId, "read", effectiveRoles);

  useEffect(() => {
    if (!loading && user && !hasPermission(pageId, "read", effectiveRoles)) {
      navigate({ to: "/members/staff" });
    }
  }, [loading, user, effectiveRoles, pageId, hasPermission, navigate]);

  if (loading || !allowed) return null;
  return <>{children}</>;
}
