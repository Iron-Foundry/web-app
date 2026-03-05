import { createRootRoute, Outlet } from "@tanstack/react-router";
import { LayoutProvider } from "@/context/LayoutContext";
import { RootLayout } from "@/components/layout/RootLayout";

export const rootRoute = createRootRoute({
  component: () => (
    <LayoutProvider>
      <RootLayout>
        <Outlet />
      </RootLayout>
    </LayoutProvider>
  ),
});