import { apiFetch } from "./client";
import type { Competition, MetricDetail, MetricMap } from "@/types/competitions";

export const competitionsApi = {
  list: () => apiFetch<Competition[]>("/clan/competitions"),

  getMetricDetail: (competitionId: number, metric: string) =>
    apiFetch<MetricDetail>(`/clan/competitions/${competitionId}/metric-detail?metric=${metric}`),

  getMetricMap: () => apiFetch<MetricMap>("/clan/competitions/metric-map"),

  updateMetricMap: (data: MetricMap) =>
    apiFetch<void>("/clan/competitions/metric-map", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
