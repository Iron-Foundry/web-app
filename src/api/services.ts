import { apiFetch } from "./client";
import type { BandwidthStats, MetricHistory, MetricHistoryParams, ServiceStatus, ServiceUptime } from "@/types/services";

export const servicesApi = {
  getStatus: () => apiFetch<ServiceStatus[]>("/services/status"),

  getHistory: ({ service, module, from, to, limit }: MetricHistoryParams) => {
    const params = new URLSearchParams({ service, module });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (limit) params.set("limit", String(limit));
    return apiFetch<MetricHistory>(`/metrics/history?${params}`);
  },

  getUptime: (days = 90) =>
    apiFetch<ServiceUptime[]>(`/services/uptime?days=${days}`),

  getBandwidth: (service = "api-backend", module = "endpoints") =>
    apiFetch<BandwidthStats>(`/metrics/bandwidth?service=${service}&module=${module}`),
};
