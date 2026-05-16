import { useEffect } from "react";
import { createRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { useAuth } from "@/context/AuthContext";

export const staffPortalLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/staff-portal",
  component: StaffPortalLayout,
});

function StaffPortalLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) return null;
  return <Outlet />;
}
