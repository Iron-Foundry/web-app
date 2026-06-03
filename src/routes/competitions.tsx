import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const competitionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/competitions",
  beforeLoad: () => {
    throw redirect({ to: "/competitions/$compId", params: { compId: "latest" }, search: { tab: undefined } });
  },
});
