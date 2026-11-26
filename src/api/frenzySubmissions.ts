import { apiFetch } from "@/api/client";
import type { FrenzySubmissionCreate, FrenzySubmissionList } from "@/types/frenzySubmission";

export interface SubmissionFilters {
  team_id?: number;
  status?: string;
  submission_type?: string;
  source?: string;
  player_rsn?: string;
  auto_approved?: boolean;
  submitted_after?: string;
  submitted_before?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

function submissionQuery(params?: SubmissionFilters): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  }
  const query = qs.toString();
  return query ? `?${query}` : "";
}

export const frenzySubmissionsApi = {
  listSubmissions: (eventId: number, params?: SubmissionFilters) =>
    apiFetch<FrenzySubmissionList>(`/frenzy/events/${eventId}/submissions${submissionQuery(params)}`),
  createSubmission: (eventId: number, data: FrenzySubmissionCreate) =>
    apiFetch<{ id: number; status: string; auto_approved: boolean }>(
      `/frenzy/events/${eventId}/submissions`,
      { method: "POST", body: JSON.stringify(data) },
    ),
  patchSubmission: (
    eventId: number,
    submissionId: number,
    data: { status: string; review_notes?: string | null },
  ) =>
    apiFetch<{ ok: boolean; status: string }>(
      `/frenzy/events/${eventId}/submissions/${submissionId}`,
      { method: "PATCH", body: JSON.stringify(data) },
    ),
  deleteSubmission: (eventId: number, submissionId: number) =>
    apiFetch<{ ok: boolean }>(
      `/frenzy/events/${eventId}/submissions/${submissionId}`,
      { method: "DELETE" },
    ),
};
