import { useCallback, useEffect, useRef, useState } from "react";
import { musicSocketUrl } from "@/api/music";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import {
  applyFrame,
  liveSessions,
  pruneStale,
  type SessionMap,
} from "@/lib/musicSessions";
import type { MusicSession, MusicSocketFrame } from "@/types/music";

const FIRST_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;
const SWEEP_EVERY_MS = 15_000;

export interface MusicLiveState {
  sessions: MusicSession[];
  connected: boolean;
}

/**
 * Watch every live music session over the API's socket.
 *
 * The socket authenticates with its first frame rather than a header or a query
 * string: a browser cannot set headers on a WebSocket, and a token in the URL
 * would be written into every access log that records the path.
 *
 * What the frames mean lives in `lib/musicSessions`; this hook owns only the
 * connection and the timers.
 */
export function useMusicSocket(enabled: boolean): MusicLiveState {
  const [sessions, setSessions] = useState<SessionMap>({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(FIRST_RETRY_MS);
  const closedRef = useRef(false);

  const apply = useCallback((frame: MusicSocketFrame): void => {
    setSessions((prev) => applyFrame(prev, frame, Date.now()));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    closedRef.current = false;

    // Self-scheduling rather than an interval: the next attempt is only queued
    // once the current socket has actually failed, so a slow API can never
    // stack connection attempts up behind each other.
    const connect = (): void => {
      const token = getAuthToken();
      if (!token || closedRef.current) return;

      const socket = new WebSocket(musicSocketUrl(API_URL));
      socketRef.current = socket;

      socket.onopen = () => {
        backoffRef.current = FIRST_RETRY_MS;
        setConnected(true);
        socket.send(JSON.stringify({ type: "auth", token }));
      };
      socket.onmessage = (event) => {
        try {
          apply(JSON.parse(event.data as string) as MusicSocketFrame);
        } catch {
          // A frame we cannot read is not worth tearing the socket down for.
        }
      };
      socket.onclose = () => {
        setConnected(false);
        if (closedRef.current) return;
        retryRef.current = setTimeout(connect, backoffRef.current);
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_RETRY_MS);
      };
      socket.onerror = () => socket.close();
    };

    connect();
    return () => {
      closedRef.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled, apply]);

  // A killed bot publishes no closing notice - its Valkey keys just expire - so
  // a page that only listened would show a player for a bot that had left.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const sweep = (): void => {
      if (cancelled) return;
      setSessions((prev) => pruneStale(prev, Date.now()));
      timer = setTimeout(sweep, SWEEP_EVERY_MS);
    };
    timer = setTimeout(sweep, SWEEP_EVERY_MS);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);

  return { sessions: liveSessions(sessions), connected };
}
