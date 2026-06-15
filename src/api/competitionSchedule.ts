import { apiFetch } from "./client";
import type {
  CompetitionSchedule,
  CreateScheduleInput,
  OverrideOptionsInput,
  PatchRunInput,
  PatchScheduleInput,
  ScheduledCompetitionRun,
} from "@/types/competitionSchedule";

export const competitionScheduleApi = {
  list: () => apiFetch<CompetitionSchedule[]>("/clan/competition-schedules"),

  get: (id: number) => apiFetch<CompetitionSchedule>(`/clan/competition-schedules/${id}`),

  create: (data: CreateScheduleInput) =>
    apiFetch<CompetitionSchedule>("/clan/competition-schedules", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: PatchScheduleInput) =>
    apiFetch<CompetitionSchedule>(`/clan/competition-schedules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiFetch<void>(`/clan/competition-schedules/${id}`, { method: "DELETE" }),

  pause: (id: number) =>
    apiFetch<CompetitionSchedule>(`/clan/competition-schedules/${id}/pause`, { method: "POST" }),

  resume: (id: number) =>
    apiFetch<CompetitionSchedule>(`/clan/competition-schedules/${id}/resume`, { method: "POST" }),

  skipNext: (id: number) =>
    apiFetch<{ skipped: boolean; next_poll_at: string }>(`/clan/competition-schedules/${id}/skip-next`, {
      method: "POST",
    }),

  triggerNow: (id: number) =>
    apiFetch<{ triggered: boolean; next_poll_at: string }>(`/clan/competition-schedules/${id}/trigger-now`, {
      method: "POST",
    }),

  setNextPollAt: (id: number, next_poll_at: string) =>
    apiFetch<CompetitionSchedule>(`/clan/competition-schedules/${id}/next-poll-at`, {
      method: "PATCH",
      body: JSON.stringify({ next_poll_at }),
    }),

  overrideOptions: (id: number, data: OverrideOptionsInput) =>
    apiFetch<ScheduledCompetitionRun>(`/clan/competition-schedules/${id}/override-options`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  patchRun: (scheduleId: number, runId: number, data: PatchRunInput) =>
    apiFetch<ScheduledCompetitionRun>(`/clan/competition-schedules/${scheduleId}/runs/${runId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getRuns: (id: number, params?: { status?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.limit != null) qs.set("limit", String(params.limit));
    const query = qs.toString() ? `?${qs}` : "";
    return apiFetch<ScheduledCompetitionRun[]>(`/clan/competition-schedules/${id}/runs${query}`);
  },
};
