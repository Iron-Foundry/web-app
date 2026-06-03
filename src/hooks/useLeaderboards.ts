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

export function useRankingResults(skip: number, limit: number, rankFilter?: string) {
  return useQuery({
    queryKey: queryKeys.ranking.results(`${skip}-${limit}-${rankFilter ?? ""}`),
    queryFn: () => leaderboardsApi.getRankingResults(skip, limit, rankFilter),
    staleTime: STALE,
  });
}

export function useRankingStats() {
  return useQuery({
    queryKey: queryKeys.ranking.stats(),
    queryFn: leaderboardsApi.getRankingStats,
    staleTime: STALE,
  });
}
