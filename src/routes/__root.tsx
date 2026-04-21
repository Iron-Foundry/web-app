import { createRootRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/RootLayout";
import { LinkRsnModal } from "@/components/layout/LinkRsnModal";
import { AuthProvider } from "@/context/AuthContext";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ViewAsProvider } from "@/context/ViewAsContext";

export const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider>
      <AuthProvider>
        <ViewAsProvider>
          <PermissionsProvider>
            <RootLayout>
              <Outlet />
            </RootLayout>
            <LinkRsnModal />
          </PermissionsProvider>
        </ViewAsProvider>
      </AuthProvider>
    </ThemeProvider>
  ),
});
