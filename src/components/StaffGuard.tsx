import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { hasMinRank } from "@/lib/ranks";

/**
 * Redirects to /members/staff if the current effective roles (respecting
 * the ViewAs preview selection) do not meet `minRank`.
 */
export function StaffGuard({ minRank, children }: { minRank: string; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const navigate = useNavigate();

  const allowed = !loading && !!user && hasMinRank(effectiveRoles, minRank);

  useEffect(() => {
    if (!loading && user && !hasMinRank(effectiveRoles, minRank)) {
      navigate({ to: "/members/staff" });
    }
  }, [loading, user, effectiveRoles, minRank, navigate]);

  if (loading || !allowed) return null;
  return <>{children}</>;
}
