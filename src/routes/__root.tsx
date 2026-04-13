import { createRootRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/RootLayout";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider>
      <AuthProvider>
        <RootLayout>
          <Outlet />
        </RootLayout>
      </AuthProvider>
    </ThemeProvider>
  ),
});
