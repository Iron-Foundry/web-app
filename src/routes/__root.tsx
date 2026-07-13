import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { RootLayout } from "@/components/layout/RootLayout";
import { LayoutProvider } from "@/context/LayoutContext";
import { LinkRsnModal } from "@/components/layout/LinkRsnModal";
import { ReferralModal } from "@/components/layout/ReferralModal";
import { AuthProvider } from "@/context/AuthContext";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ViewAsProvider } from "@/context/ViewAsContext";
import { queryClient } from "@/lib/queryClient";

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster position="bottom-right" richColors theme={theme} />;
}

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ViewAsProvider>
          <AuthProvider>
            <PermissionsProvider>
              <ThemedToaster />
              <LayoutProvider>
                <RootLayout>
                  <Outlet />
                </RootLayout>
              </LayoutProvider>
              <LinkRsnModal />
              <ReferralModal />
              <ReactQueryDevtools initialIsOpen={false} />
            </PermissionsProvider>
          </AuthProvider>
        </ViewAsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export const rootRoute = createRootRoute({ component: Root });
