import { useEffect } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      sessionStorage.setItem("auth_token", token);
      window.history.replaceState({}, "", window.location.pathname);
      navigate({ to: "/members" });
    } else {
      navigate({ to: "/" });
    }
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Logging in…</p>
    </div>
  );
}
