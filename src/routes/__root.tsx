import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { RootLayout } from "@/components/layout/RootLayout";
import { LinkRsnModal } from "@/components/layout/LinkRsnModal";
import { AuthProvider } from "@/context/AuthContext";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ViewAsProvider } from "@/context/ViewAsContext";
import { ApiRequestError } from "@/api/client";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: (failureCount, error) => {
        if (error instanceof ApiRequestError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    },
  },
});

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ViewAsProvider>
            <PermissionsProvider>
              <Toaster position="bottom-right" richColors />
              <RootLayout>
                <Outlet />
              </RootLayout>
              <LinkRsnModal />
              <ReactQueryDevtools initialIsOpen={false} />
            </PermissionsProvider>
          </ViewAsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export const rootRoute = createRootRoute({ component: Root });
