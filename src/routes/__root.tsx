import { createRootRoute, Outlet, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
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
import { ControlPanelProvider, useControlPanel } from "@/context/ControlPanelContext";
import { ControlPanel } from "@/components/members/ControlPanel";
import { MusicProvider, useMusic } from "@/context/MusicContext";
import { MiniPlayer } from "@/components/music/MiniPlayer";
import { MusicPanel } from "@/components/music/MusicPanel";
import { queryClient } from "@/lib/queryClient";

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster position="bottom-right" richColors theme={theme} />;
}

/** Supports legacy `?cp=<pageId>` deep links by opening the panel and stripping the param. */
function ControlPanelDeepLink() {
  const { openPanel } = useControlPanel();
  const search = useSearch({ strict: false }) as { cp?: string };
  const navigate = useNavigate();

  useEffect(() => {
    if (search.cp) {
      openPanel(search.cp);
      navigate({
        search: ((prev: Record<string, unknown>) => ({ ...prev, cp: undefined })) as never,
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.cp]);

  return null;
}

function GlobalControlPanel() {
  const { open, pageId, closePanel } = useControlPanel();
  return (
    <ControlPanel
      open={open}
      initialPageId={pageId}
      onOpenChange={(next) => {
        if (!next) closePanel();
      }}
    />
  );
}

function GlobalMusicPanel() {
  const { open, pageId, closePanel } = useMusic();
  return (
    <MusicPanel
      open={open}
      initialPageId={pageId}
      onOpenChange={(next) => {
        if (!next) closePanel();
      }}
    />
  );
}

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ViewAsProvider>
          <AuthProvider>
            <PermissionsProvider>
              <ControlPanelProvider>
                <MusicProvider>
                  <ThemedToaster />
                  <LayoutProvider>
                    <RootLayout>
                      <Outlet />
                    </RootLayout>
                  </LayoutProvider>
                  <LinkRsnModal />
                  <ReferralModal />
                  <ControlPanelDeepLink />
                  <GlobalControlPanel />
                  <GlobalMusicPanel />
                  <MiniPlayer />
                  <ReactQueryDevtools initialIsOpen={false} />
                </MusicProvider>
              </ControlPanelProvider>
            </PermissionsProvider>
          </AuthProvider>
        </ViewAsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export const rootRoute = createRootRoute({ component: Root });
