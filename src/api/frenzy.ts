import { apiFetch } from "@/api/client";
import type { DraftMember } from "@/types/frenzyDraft";
import type { FrenzyActiveEvent, FrenzyBoard, FrenzyEventDetail, FrenzyEventHistory, FrenzyEventSummary, FrenzyLeaderboardEntry, FrenzyTeamDetail, FrenzyTeamHistory, OsrsActivity, OsrsBoss, OsrsItem } from "@/types/frenzy";

export const frenzyApi = {
  // Public
  getActiveEvent: () => apiFetch<FrenzyActiveEvent>("/frenzy/active"),
  getActiveBoard: () => apiFetch<FrenzyBoard>("/frenzy/active/board"),
  getActiveSignups: () => apiFetch<{ event_id: number; members: DraftMember[] }>("/frenzy/active/signups"),
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
};
