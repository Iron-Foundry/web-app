import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { musicApi } from "@/api/music";
import { queryKeys } from "@/lib/queryKeys";
import type {
  MusicCommand,
  PlaylistDetail,
  SearchSource,
  TrackInput,
} from "@/types/music";

/** How long a queue read stays fresh. The socket is what actually keeps it current. */
const QUEUE_STALE_MS = 2_000;

/** A search result is worth keeping while the panel is open. */
const SEARCH_STALE_MS = 5 * 60_000;

export function useMusicQueue(channelId: string | null) {
  return useQuery({
    queryKey: queryKeys.music.queue(channelId ?? ""),
    queryFn: () => musicApi.getQueue(channelId as string),
    enabled: channelId !== null,
    staleTime: QUEUE_STALE_MS,
  });
}

export function useMusicActivity(channelId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.music.activity(channelId ?? ""),
    queryFn: () => musicApi.getActivity(channelId as string),
    enabled: channelId !== null && enabled,
    staleTime: QUEUE_STALE_MS,
  });
}

export function useMusicHistory(channelId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.music.history(channelId ?? ""),
    queryFn: () => musicApi.getHistory(channelId as string),
    enabled: channelId !== null && enabled,
    staleTime: QUEUE_STALE_MS,
  });
}

export function useMayControl(channelId: string | null) {
  return useQuery({
    queryKey: queryKeys.music.control(channelId ?? ""),
    queryFn: () => musicApi.getControl(channelId as string),
    enabled: channelId !== null,
  });
}

export function useSendMusicCommand(channelId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (command: MusicCommand) =>
      musicApi.sendCommand(channelId as string, command),
    // The session itself arrives back over the socket; the queue does not, so
    // it is the one thing worth re-reading after a command that reorders it.
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: queryKeys.music.queue(channelId ?? ""),
      }),
  });
}

/**
 * Resolve a query into tracks.
 *
 * Only runs once a query is submitted rather than on every keystroke: each one
 * is a real round trip to Lavalink, and a half-typed query is not a search.
 */
export function useTrackSearch(query: string, source: SearchSource) {
  return useQuery({
    queryKey: queryKeys.music.search(query, source),
    queryFn: () => musicApi.search(query, source),
    enabled: query.trim().length > 0,
    staleTime: SEARCH_STALE_MS,
  });
}
