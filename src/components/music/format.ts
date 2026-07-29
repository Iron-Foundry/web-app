import type { MusicHistory, MusicSession, TrackInput } from "@/types/music";

/**
 * `12h 04m`, or `4m` under an hour.
 *
 * Separate from `duration` because a clan total runs to days: rendering it as
 * `mm:ss` would put four digits in the minutes column and read as nonsense.
 */
export function listenedTotal(milliseconds: number): string {
  const minutes = Math.floor(Math.max(0, milliseconds) / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours > 0
    ? `${hours}h ${String(minutes % 60).padStart(2, "0")}m`
    : `${minutes}m`;
}

/** A played track in the shape a playlist and the `add` command both take. */
export function toTrackInput(entry: MusicHistory): TrackInput {
  return {
    source: entry.track.source,
    identifier: entry.track.identifier,
    title: entry.track.title,
    author: entry.track.author,
    duration_ms: entry.track.length_ms,
    isrc: entry.track.isrc,
    uri: entry.track.uri,
    artwork: entry.track.artwork,
  };
}

/** `4:07`, or `1:02:33` once it passes an hour. */
export function duration(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number): string => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/**
 * Where the track has actually reached, extrapolated from the last state change.
 *
 * The API reports the position it had when the session last moved rather than
 * keeping one current, so the browser advances it locally while the track is
 * playing. That is what makes a progress bar cost no polling.
 *
 * Rounded, because `updated_at` is a float epoch: without this the extrapolated
 * position is fractional, and a seek built from it is refused by the API - a
 * position in milliseconds is a whole number there.
 */
export function livePosition(session: MusicSession, nowMs: number): number {
  if (!session.current) return 0;
  if (session.paused || session.updated_at === 0) return session.position_ms;
  const elapsed = nowMs - session.updated_at * 1000;
  return Math.round(
    Math.min(session.current.length_ms, session.position_ms + Math.max(0, elapsed)),
  );
}

/** Where the audio came from, naming the mirror only when it differs. */
export function sourceLabel(
  requested: string,
  played: string | null | undefined,
): string {
  const actual = played ?? requested;
  return actual === requested ? actual : `${requested} → ${actual}`;
}

export const SOURCE_ACCENT: Record<string, string> = {
  spotify: "text-[#1DB954]",
  youtube: "text-[#FF0000]",
  soundcloud: "text-[#FF5500]",
};
