import type { components } from "@/api/schema";

export type MusicSession = components["schemas"]["SessionOut"];
export type MusicTrack = components["schemas"]["SessionTrack"];
export type MusicActivity = components["schemas"]["ActivityOut"];
export type MusicHistory = components["schemas"]["HistoryOut"];
export type MusicClanStats = components["schemas"]["ClanStatsOut"];
export type MusicTopTrack = components["schemas"]["TopTrackOut"];
export type MusicCommand = components["schemas"]["CommandRequest"];
export type SearchResult = components["schemas"]["SearchResult"];
export type SearchSource = "spotify" | "youtube" | "youtubemusic" | "soundcloud";
export type MusicCommandAction = MusicCommand["action"];
export type Playlist = components["schemas"]["PlaylistOut"];
export type PlaylistDetail = components["schemas"]["PlaylistDetailOut"];

/** A frame pushed over the live socket. */
export type MusicSocketFrame =
  | { type: "sessions"; sessions: MusicSession[] }
  | { type: "session"; session: MusicSession }
  | { type: "closed"; voice_channel_id: string };

/** A track as it is saved into a playlist. */
export interface TrackInput {
  source: string;
  identifier: string;
  title: string;
  author: string;
  duration_ms: number;
  isrc?: string | null;
  uri?: string | null;
  artwork?: string | null;
}
