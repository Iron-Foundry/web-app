import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useMusicSocket } from "@/hooks/useMusicSocket";
import { queryKeys } from "@/lib/queryKeys";
import type { MusicSession } from "@/types/music";

interface MusicContextValue {
  /** Every session that is live right now, newest state from the socket. */
  sessions: MusicSession[];
  /** The session the panel and the mini player are both looking at. */
  session: MusicSession | null;
  channelId: string | null;
  selectChannel: (channelId: string) => void;
  connected: boolean;
  open: boolean;
  pageId: string | null;
  openPanel: (pageId?: string) => void;
  closePanel: () => void;
}

const MusicContext = createContext<MusicContextValue>({
  sessions: [],
  session: null,
  channelId: null,
  selectChannel: () => {},
  connected: false,
  open: false,
  pageId: null,
  openPanel: () => {},
  closePanel: () => {},
});

/**
 * One socket for the whole page.
 *
 * The mini player and the panel show the same session, so they share a
 * subscription rather than opening one each - a second socket would double the
 * server's fan-out for no extra information.
 */
export function MusicProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { sessions, connected } = useMusicSocket(user !== null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);

  // Follow whatever is live: nothing selected, or a channel whose session has
  // ended, falls to the first one still playing.
  useEffect(() => {
    const stillLive = sessions.some((s) => s.voice_channel_id === channelId);
    if (!stillLive) setChannelId(sessions[0]?.voice_channel_id ?? null);
  }, [sessions, channelId]);

  const watched = sessions.find((s) => s.voice_channel_id === channelId);

  // Whether this viewer may drive the session is answered per viewer, so it
  // cannot ride the broadcast payload. The listener count can, and it changes
  // exactly when someone joins or leaves - which is exactly when the answer
  // might have changed. Re-ask then, rather than polling for it.
  useEffect(() => {
    if (channelId === null) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.music.control(channelId) });
  }, [channelId, watched?.listener_count, queryClient]);

  // The socket carries the session, not its queue, activity or history - those
  // are read over REST. `updated_at` moves on every state change, including
  // ones this page did not cause, so it is the signal that any of them might
  // now be stale. Without this, a track queued from Discord bumps the count on
  // screen while the list of rows keeps showing whatever it held when the page
  // opened.
  useEffect(() => {
    if (channelId === null) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.music.queue(channelId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.music.activity(channelId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.music.history(channelId) });
  }, [channelId, watched?.updated_at, queryClient]);

  const value = useMemo<MusicContextValue>(() => {
    const session = sessions.find((s) => s.voice_channel_id === channelId) ?? null;
    return {
      sessions,
      session,
      channelId,
      selectChannel: setChannelId,
      connected,
      open,
      pageId,
      openPanel: (id) => {
        setPageId(id ?? null);
        setOpen(true);
      },
      closePanel: () => setOpen(false),
    };
  }, [sessions, channelId, connected, open, pageId]);

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic(): MusicContextValue {
  return useContext(MusicContext);
}
