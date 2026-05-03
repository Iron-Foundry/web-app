import { apiFetch } from "./client";
import type {
  Competition,
  CreateCompetitionInput,
  EditCompetitionInput,
  MetricDetail,
  MetricMap,
  ParticipantSuggestion,
} from "@/types/competitions";

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

  create: (data: CreateCompetitionInput) =>
    apiFetch<Competition>("/clan/competitions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (compId: number, data: EditCompetitionInput) =>
    apiFetch<Competition>(`/clan/competitions/${compId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (compId: number) =>
    apiFetch<void>(`/clan/competitions/${compId}`, {
      method: "DELETE",
    }),

  getParticipants: () =>
    apiFetch<ParticipantSuggestion[]>("/clan/competitions/participants"),
};
