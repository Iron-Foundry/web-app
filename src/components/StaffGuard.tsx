import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";

/**
 * Redirects to `redirectTo` (default: /members/staff) if the current effective
 * roles do not have read permission on `pageId`.
 */
export function StaffGuard({
  pageId,
  children,
  redirectTo = "/members/staff",
}: {
  pageId: string;
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const { user, loading } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const navigate = useNavigate();

  const allowed = !loading && !!user && hasPermission(pageId, "read", effectiveRoles);

  useEffect(() => {
    if (!loading && user && !hasPermission(pageId, "read", effectiveRoles)) {
      navigate({ to: redirectTo });
    }
  }, [loading, user, effectiveRoles, pageId, hasPermission, navigate, redirectTo]);

  if (loading || !allowed) return null;
  return <>{children}</>;
}
