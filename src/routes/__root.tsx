import { createRootRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/RootLayout";
import { AuthProvider } from "@/context/AuthContext";

export const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <RootLayout>
        <Outlet />
      </RootLayout>
    </AuthProvider>
  ),
});
