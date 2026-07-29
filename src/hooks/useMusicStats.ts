import { useQuery } from "@tanstack/react-query";
import { musicApi } from "@/api/music";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Clan listening totals. Nothing here is per member - the counters behind them
 * carry a guild and a track and never a user id.
 *
 * They move once per finished track at most, so they are cached far longer than
 * anything on the live surface.
 */
const STATS_STALE_MS = 5 * 60_000;

export function useMusicStats(days: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.music.stats(days),
    queryFn: () => musicApi.getStats(days),
    enabled,
    staleTime: STATS_STALE_MS,
  });
}

export function useMusicTopTracks(limit: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.music.topTracks(limit),
    queryFn: () => musicApi.getTopTracks(limit),
    enabled,
    staleTime: STATS_STALE_MS,
  });
}
