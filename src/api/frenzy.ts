import { apiFetch } from "@/api/client";
import type {
  FrenzyActiveEvent,
  FrenzyEventDetail,
  FrenzyEventHistory,
  FrenzyEventSummary,
  FrenzyLeaderboardEntry,
  FrenzySubmission,
  FrenzySubmissionCreate,
  FrenzySubmissionList,
  FrenzyTemplate,
  FrenzyTemplateSummary,
  FrenzyTemplateUpdate,
  FrenzyTeamDetail,
  FrenzyTeamHistory,
  FrenzyVersionDetail,
  FrenzyVersionSummary,
  OsrsActivity,
  OsrsBoss,
  OsrsItem,
} from "@/types/frenzy";

export const frenzyApi = {
  // Public
  getActiveEvent: () => apiFetch<FrenzyActiveEvent>("/frenzy/active"),
  getTeamDetail: (teamSlug: string) =>
    apiFetch<FrenzyTeamDetail>(`/frenzy/active/teams/${teamSlug}`),
  getLeaderboards: () =>
    apiFetch<{ data: FrenzyLeaderboardEntry[]; pending_metrics: string[]; stale?: boolean }>(
      "/frenzy/leaderboards",
    ),
  getTeamHistory: (teamSlug: string) =>
    apiFetch<FrenzyTeamHistory>(`/frenzy/active/teams/${teamSlug}/history`),
  getEventHistory: () => apiFetch<FrenzyEventHistory>("/frenzy/active/history"),

  // OSRS reference data
  searchItems: (q: string) =>
    apiFetch<OsrsItem[]>(`/frenzy/osrs/items?q=${encodeURIComponent(q)}`),
  getBosses: () => apiFetch<OsrsBoss[]>("/frenzy/osrs/bosses"),
  getActivities: () => apiFetch<OsrsActivity[]>("/frenzy/osrs/activities"),

  // Admin - Templates
  listTemplates: () => apiFetch<FrenzyTemplateSummary[]>("/frenzy/templates"),
  createTemplate: (data: FrenzyTemplateUpdate) =>
    apiFetch<{ id: number; version_number: number }>("/frenzy/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getTemplate: (id: number) => apiFetch<FrenzyTemplate>(`/frenzy/templates/${id}`),
  updateTemplate: (id: number, data: FrenzyTemplateUpdate) =>
    apiFetch<{ id: number; version_number: number; updated_at: string }>(
      `/frenzy/templates/${id}`,
      { method: "PUT", body: JSON.stringify(data) },
    ),
  deleteTemplate: (id: number) =>
    apiFetch<{ ok: boolean }>(`/frenzy/templates/${id}`, { method: "DELETE" }),
  listTemplateVersions: (id: number) =>
    apiFetch<FrenzyVersionSummary[]>(`/frenzy/templates/${id}/versions`),
  getTemplateVersion: (id: number, vid: number) =>
    apiFetch<FrenzyVersionDetail>(`/frenzy/templates/${id}/versions/${vid}`),
  revertTemplate: (id: number, vid: number) =>
    apiFetch<{ id: number; version_number: number; updated_at: string }>(
      `/frenzy/templates/${id}/revert/${vid}`,
      { method: "POST" },
    ),

  // Admin - Events
  listEvents: () => apiFetch<FrenzyEventSummary[]>("/frenzy/events"),
  createEvent: (data: {
    name: string;
    template_id: number;
    wom_comp_id?: number | null;
    leaderboard_metrics?: string[];
    trusted_sources?: string[];
    starts_at?: string | null;
    ends_at?: string | null;
  }) =>
    apiFetch<{ id: number }>("/frenzy/events", { method: "POST", body: JSON.stringify(data) }),
  getEvent: (id: number) => apiFetch<FrenzyEventDetail>(`/frenzy/events/${id}`),
  patchEvent: (
    id: number,
    data: {
      name?: string;
      wom_comp_id?: number | null;
      leaderboard_metrics?: string[];
      trusted_sources?: string[];
      starts_at?: string | null;
      ends_at?: string | null;
    },
  ) =>
    apiFetch<{ ok: boolean }>(`/frenzy/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteEvent: (id: number) =>
    apiFetch<{ ok: boolean }>(`/frenzy/events/${id}`, { method: "DELETE" }),
  activateEvent: (id: number) =>
    apiFetch<{ ok: boolean; active_event_id: number }>(`/frenzy/events/${id}/activate`, {
      method: "POST",
    }),
  deactivateEvent: (id: number) =>
    apiFetch<{ ok: boolean }>(`/frenzy/events/${id}/deactivate`, { method: "POST" }),

  // Admin - Teams
  addTeam: (
    eventId: number,
    data: { name: string; slug: string; icon_url?: string | null; sort_order?: number },
  ) =>
    apiFetch<{ id: number; slug: string }>(`/frenzy/events/${eventId}/teams`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  patchTeam: (
    eventId: number,
    slug: string,
    data: {
      name?: string;
      icon_url?: string | null;
      sort_order?: number;
      item_progress?: Record<string, number>;
      activity_progress?: Record<string, number>;
      milestone_progress?: Record<string, number>;
    },
  ) =>
    apiFetch<{ ok: boolean }>(`/frenzy/events/${eventId}/teams/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTeam: (eventId: number, slug: string) =>
    apiFetch<{ ok: boolean }>(`/frenzy/events/${eventId}/teams/${slug}`, { method: "DELETE" }),

  syncEventFromWom: (eventId: number) =>
    apiFetch<{
      starts_at: string | null;
      ends_at: string | null;
      teams_synced: number;
      teams: Array<{ name: string; slug: string; participants: string[] }>;
    }>(`/frenzy/events/${eventId}/sync-wom`, { method: "POST" }),

  refreshLeaderboards: () =>
    apiFetch<{ ok: boolean }>("/frenzy/leaderboards/refresh", { method: "POST" }),

  // Admin - Submissions
  listSubmissions: (
    eventId: number,
    params?: {
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
    },
  ) => {
    const qs = new URLSearchParams();
    if (params?.team_id != null) qs.set("team_id", String(params.team_id));
    if (params?.status) qs.set("status", params.status);
    if (params?.submission_type) qs.set("submission_type", params.submission_type);
    if (params?.source) qs.set("source", params.source);
    if (params?.player_rsn) qs.set("player_rsn", params.player_rsn);
    if (params?.auto_approved != null) qs.set("auto_approved", String(params.auto_approved));
    if (params?.submitted_after) qs.set("submitted_after", params.submitted_after);
    if (params?.submitted_before) qs.set("submitted_before", params.submitted_before);
    if (params?.q) qs.set("q", params.q);
    if (params?.limit != null) qs.set("limit", String(params.limit));
    if (params?.offset != null) qs.set("offset", String(params.offset));
    const query = qs.toString();
    return apiFetch<FrenzySubmissionList>(
      `/frenzy/events/${eventId}/submissions${query ? `?${query}` : ""}`,
    );
  },
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
