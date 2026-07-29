import { apiFetch } from "./client";
import type {
  MusicActivity,
  MusicClanStats,
  MusicCommand,
  MusicHistory,
  MusicSession,
  MusicTopTrack,
  MusicTrack,
  Playlist,
  PlaylistDetail,
  SearchResult,
  SearchSource,
  TrackInput,
} from "@/types/music";

export const musicApi = {
  listSessions: (): Promise<MusicSession[]> => apiFetch("/music/sessions"),

  /** Resolve a query or a link. Needs no session - searching is not playback. */
  search: (query: string, source: SearchSource): Promise<SearchResult[]> =>
    apiFetch(`/music/search?q=${encodeURIComponent(query)}&source=${source}`),

  getSession: (channelId: string): Promise<MusicSession> =>
    apiFetch(`/music/sessions/${channelId}`),

  getQueue: (channelId: string): Promise<MusicTrack[]> =>
    apiFetch(`/music/sessions/${channelId}/queue`),

  getActivity: (channelId: string): Promise<MusicActivity[]> =>
    apiFetch(`/music/sessions/${channelId}/activity`),

  /** Everything this session has already played. The panel only shows ten. */
  getHistory: (channelId: string): Promise<MusicHistory[]> =>
    apiFetch(`/music/sessions/${channelId}/history`),

  getStats: (days: number): Promise<MusicClanStats> =>
    apiFetch(`/music/stats?days=${days}`),

  getTopTracks: (limit: number): Promise<MusicTopTrack[]> =>
    apiFetch(`/music/stats/top-tracks?limit=${limit}`),

  /** Whether this viewer is in the voice channel, and so allowed to drive it. */
  getControl: (channelId: string): Promise<{ may_control: boolean }> =>
    apiFetch(`/music/sessions/${channelId}/control`),

  sendCommand: (channelId: string, command: MusicCommand): Promise<unknown> =>
    apiFetch(`/music/sessions/${channelId}/commands`, {
      method: "POST",
      body: JSON.stringify(command),
    }),

  listPlaylists: (
    scope: "mine" | "public" | "all" = "all",
  ): Promise<Playlist[]> => apiFetch(`/music/playlists?scope=${scope}`),

  getPlaylist: (playlistId: number): Promise<PlaylistDetail> =>
    apiFetch(`/music/playlists/${playlistId}`),

  /** Pull a YouTube or YouTube Music playlist link in as a new playlist. */
  importPlaylist: (body: {
    url: string;
    name?: string | null;
    is_public: boolean;
  }): Promise<PlaylistDetail> =>
    apiFetch("/music/playlists/import", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createPlaylist: (body: {
    name: string;
    is_public: boolean;
    tracks: TrackInput[];
  }): Promise<PlaylistDetail> =>
    apiFetch("/music/playlists", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updatePlaylist: (
    playlistId: number,
    body: { name?: string; is_public?: boolean },
  ): Promise<PlaylistDetail> =>
    apiFetch(`/music/playlists/${playlistId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deletePlaylist: (playlistId: number): Promise<void> =>
    apiFetch(`/music/playlists/${playlistId}`, { method: "DELETE" }),

  appendTracks: (
    playlistId: number,
    tracks: TrackInput[],
  ): Promise<PlaylistDetail> =>
    apiFetch(`/music/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({ tracks }),
    }),

  replaceTracks: (
    playlistId: number,
    tracks: TrackInput[],
  ): Promise<PlaylistDetail> =>
    apiFetch(`/music/playlists/${playlistId}/tracks`, {
      method: "PUT",
      body: JSON.stringify({ tracks }),
    }),
};

/** The live socket URL, derived from the API base so both follow one env var. */
export function musicSocketUrl(apiUrl: string): string {
  return `${apiUrl.replace(/^http/, "ws")}/music/live`;
}
