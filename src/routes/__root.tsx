import { createRootRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/RootLayout";
import { AuthProvider } from "@/context/AuthContext";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider>
      <AuthProvider>
        <PermissionsProvider>
          <RootLayout>
            <Outlet />
          </RootLayout>
        </PermissionsProvider>
      </AuthProvider>
    </ThemeProvider>
  ),
});
