import { apiFetch } from "@/api/client";
import type {
  DiceRollResult,
  RepositoryTile,
  SabotageAction,
  TileCompletion,
  TileRaceEvent,
  TileRaceEventCreate,
  TileRaceEventPatch,
  TileRaceEventSummary,
  TileRaceTeamCreate,
  TileTag,
} from "@/types/tilerace";

export const tileraceApi = {
  // Public
  getActiveEvent: () => apiFetch<TileRaceEvent>("/tilerace/active"),
  getEvent: (id: string) => apiFetch<TileRaceEvent>(`/tilerace/events/${id}`),
  signUp: (eventId: string, accountId: number, wantsCaptain: boolean) =>
    apiFetch<{ ok: boolean }>(`/tilerace/events/${eventId}/signup`, {
      method: "POST",
      body: JSON.stringify({ account_id: accountId, wants_captain: wantsCaptain }),
    }),
  changeSignup: (eventId: string, accountId: number, wantsCaptain: boolean) =>
    apiFetch<{ ok: boolean }>(`/tilerace/events/${eventId}/signup`, {
      method: "PATCH",
      body: JSON.stringify({ account_id: accountId, wants_captain: wantsCaptain }),
    }),
  cancelSignup: (eventId: string) =>
    apiFetch<{ ok: boolean }>(`/tilerace/events/${eventId}/signup`, { method: "DELETE" }),

  // OSRS reference (reuses frenzy endpoint)
  searchItems: (q: string) =>
    apiFetch<Array<{ id: number; name: string; icon_url: string }>>(
      `/frenzy/osrs/items?q=${encodeURIComponent(q)}`,
    ),
  searchNpcs: (q: string) =>
    apiFetch<Array<{ id: number; name: string; icon_url: string }>>(
      `/tilerace/osrs/npcs?q=${encodeURIComponent(q)}`,
    ),

  // Repository
  listTiles: (params?: { tag?: TileTag; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.tag) qs.set("tag", params.tag);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    return apiFetch<RepositoryTile[]>(`/tilerace/repository${query ? `?${query}` : ""}`);
  },
  createTile: (data: Omit<RepositoryTile, "id" | "created_at" | "updated_at">) =>
    apiFetch<{ id: string }>("/tilerace/repository", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getTile: (id: string) => apiFetch<RepositoryTile>(`/tilerace/repository/${id}`),
  updateTile: (id: string, data: Partial<Omit<RepositoryTile, "id" | "created_at" | "updated_at">>) =>
    apiFetch<{ ok: boolean }>(`/tilerace/repository/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTile: (id: string) =>
    apiFetch<{ ok: boolean }>(`/tilerace/repository/${id}`, { method: "DELETE" }),

  // Admin - Events
  listEvents: () => apiFetch<TileRaceEventSummary[]>("/tilerace/events"),
  createEvent: (data: TileRaceEventCreate) =>
    apiFetch<{ id: string }>("/tilerace/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  patchEvent: (id: string, data: TileRaceEventPatch) =>
    apiFetch<{ ok: boolean }>(`/tilerace/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteEvent: (id: string) =>
    apiFetch<{ ok: boolean }>(`/tilerace/events/${id}`, { method: "DELETE" }),
  activateEvent: (id: string) =>
    apiFetch<{ ok: boolean }>(`/tilerace/events/${id}/activate`, { method: "POST" }),
  deactivateEvent: (id: string) =>
    apiFetch<{ ok: boolean }>(`/tilerace/events/${id}/deactivate`, { method: "POST" }),

  // Admin - Teams
  addTeam: (eventId: string, data: TileRaceTeamCreate) =>
    apiFetch<{ id: string }>(`/tilerace/events/${eventId}/teams`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  patchTeam: (
    eventId: string,
    teamId: string,
    data: Partial<TileRaceTeamCreate> & { members?: string[]; position?: number },
  ) =>
    apiFetch<{ ok: boolean }>(`/tilerace/events/${eventId}/teams/${teamId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTeam: (eventId: string, teamId: string) =>
    apiFetch<{ ok: boolean }>(`/tilerace/events/${eventId}/teams/${teamId}`, {
      method: "DELETE",
    }),
  scrambleTeams: (eventId: string) =>
    apiFetch<{ ok: boolean }>(`/tilerace/events/${eventId}/teams/scramble`, { method: "POST" }),

  // Controls
  rollDice: (eventId: string, teamId: string) =>
    apiFetch<DiceRollResult>(`/tilerace/events/${eventId}/teams/${teamId}/roll`, {
      method: "POST",
    }),
  setFogOfWar: (eventId: string, enabled: boolean) =>
    apiFetch<{ ok: boolean }>(`/tilerace/events/${eventId}/fog-of-war`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),

  // Completions
  listCompletions: (eventId: string) =>
    apiFetch<TileCompletion[]>(`/tilerace/events/${eventId}/completions`),
  toggleCompletion: (
    eventId: string,
    teamId: string,
    pathPosition: number,
    completed: boolean,
  ) =>
    apiFetch<{ ok: boolean; completed: boolean }>(
      `/tilerace/events/${eventId}/teams/${teamId}/completions/${pathPosition}`,
      { method: "PUT", body: JSON.stringify({ completed }) },
    ),

  // Sabotage
  sabotage: (
    eventId: string,
    teamId: string,
    data: { action: SabotageAction; target_team_id: string; amount: number },
  ) =>
    apiFetch<{ ok: boolean; action: string }>(
      `/tilerace/events/${eventId}/teams/${teamId}/sabotage`,
      {
        method: "POST",
        body: JSON.stringify({
          action: data.action,
          target_team_id: Number(data.target_team_id),
          amount: data.amount,
        }),
      },
    ),
};
