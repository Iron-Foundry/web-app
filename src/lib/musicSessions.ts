import type { MusicSession, MusicSocketFrame } from "@/types/music";

/**
 * The bot re-announces every live session once a minute. A session we have not
 * heard from in well over two of those rounds is treated as gone: a killed bot
 * publishes no closing notice, so silence is the only signal there is.
 */
export const STALE_AFTER_MS = 150_000;

/** A session, and when we last heard anything about it. */
export interface SeenSession {
  session: MusicSession;
  at: number;
}

export type SessionMap = Record<string, SeenSession>;

/**
 * Fold one socket frame into what the page knows.
 *
 * Kept apart from the socket itself so the rules can be asserted without a
 * WebSocket, a browser or a React tree.
 */
export function applyFrame(
  state: SessionMap,
  frame: MusicSocketFrame,
  at: number,
): SessionMap {
  if (frame.type === "sessions") {
    return Object.fromEntries(
      frame.sessions.map((session) => [session.voice_channel_id, { session, at }]),
    );
  }
  if (frame.type === "session") {
    return { ...state, [frame.session.voice_channel_id]: { session: frame.session, at } };
  }
  if (!(frame.voice_channel_id in state)) return state;
  const next = { ...state };
  delete next[frame.voice_channel_id];
  return next;
}

/**
 * Drop sessions nothing has been heard from lately.
 *
 * Returns the same object when nothing expired, so a sweep that changes nothing
 * cannot cause a re-render.
 */
export function pruneStale(
  state: SessionMap,
  now: number,
  staleAfterMs: number = STALE_AFTER_MS,
): SessionMap {
  const cutoff = now - staleAfterMs;
  const live = Object.entries(state).filter(([, seen]) => seen.at >= cutoff);
  return live.length === Object.keys(state).length ? state : Object.fromEntries(live);
}

/** The sessions themselves, in a stable order. */
export function liveSessions(state: SessionMap): MusicSession[] {
  return Object.values(state)
    .map((seen) => seen.session)
    .sort((a, b) => a.voice_channel_id.localeCompare(b.voice_channel_id));
}
