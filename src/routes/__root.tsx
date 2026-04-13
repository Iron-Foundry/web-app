import { createRootRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/RootLayout";

export const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
});
