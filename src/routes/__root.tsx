import { useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/RootLayout";
import { LinkRsnModal } from "@/components/layout/LinkRsnModal";
import { AuthProvider, API_URL } from "@/context/AuthContext";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ViewAsProvider } from "@/context/ViewAsContext";
import { fetchCached } from "@/lib/cache";

function PrefetchLeaderboards() {
  useEffect(() => {
    fetchCached(`${API_URL}/clan/leaderboards/killcounts`, { cacheKey: "leaderboards:kc" }).catch(() => {});
    fetchCached(`${API_URL}/clan/leaderboards/leagues`, { cacheKey: "leaderboards:leagues" }).catch(() => {});
  }, []);
  return null;
}

function Root() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ViewAsProvider>
          <PermissionsProvider>
            <PrefetchLeaderboards />
            <RootLayout>
              <Outlet />
            </RootLayout>
            <LinkRsnModal />
          </PermissionsProvider>
        </ViewAsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export const rootRoute = createRootRoute({ component: Root });
