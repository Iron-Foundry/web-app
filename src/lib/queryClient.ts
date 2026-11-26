import { QueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "@/api/client";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

/** 502, 503 and 504 mean an upstream (such as OSRSClans) is failing; a retry only adds load. */
const GATEWAY_FAILURES = new Set([502, 503, 504]);

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiRequestError && (error.status < 500 || GATEWAY_FAILURES.has(error.status))) return false;
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: shouldRetry,
    },
    mutations: {
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    },
  },
});
