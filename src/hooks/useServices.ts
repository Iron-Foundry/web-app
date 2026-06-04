import { useQuery } from "@tanstack/react-query";
import { servicesApi } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import type { MetricHistoryParams } from "@/types/services";

export function useServicesStatus() {
  return useQuery({
    queryKey: queryKeys.services.status(),
    queryFn: servicesApi.getStatus,
    refetchInterval: 30_000,
  });
}

export function useMetricHistory(params: MetricHistoryParams & { range: string }) {
  return useQuery({
    queryKey: queryKeys.services.history(params.service, params.module, params.range),
    queryFn: () => servicesApi.getHistory(params),
    refetchInterval: 60_000,
    enabled: Boolean(params.service && params.module),
  });
}

export function useServicesUptime(days = 90) {
  return useQuery({
    queryKey: queryKeys.services.uptime(days),
    queryFn: () => servicesApi.getUptime(days),
    refetchInterval: 300_000,
  });
}

export function useBandwidth(service = "api-backend", module = "endpoints") {
  return useQuery({
    queryKey: queryKeys.services.bandwidth(service, module),
    queryFn: () => servicesApi.getBandwidth(service, module),
    refetchInterval: 300_000,
  });
}

export function useWomRateLimit() {
  return useQuery({
    queryKey: queryKeys.services.womRateLimit(),
    queryFn: servicesApi.getWomRateLimit,
    refetchInterval: 15_000,
  });
}
