import { useQuery } from "@tanstack/react-query";
import { leaderboardsApi } from "@/api/leaderboards";
import { queryKeys } from "@/lib/queryKeys";

const STALE = 1000 * 60 * 5;

export function usePbLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboards.pb(),
    queryFn: leaderboardsApi.getPbs,
    staleTime: STALE,
  });
}

export function useClogLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboards.clog(),
    queryFn: leaderboardsApi.getCollectionLog,
    staleTime: STALE,
  });
}

export function useKillcountLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboards.killcounts(),
    queryFn: leaderboardsApi.getKillcounts,
    staleTime: STALE,
  });
}

export function useLeagueLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboards.leagues(),
    queryFn: leaderboardsApi.getLeagues,
    staleTime: STALE,
  });
}
