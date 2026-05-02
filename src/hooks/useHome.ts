import { useQuery } from "@tanstack/react-query";
import { membersApi } from "@/api/members";
import { queryKeys } from "@/lib/queryKeys";

const STALE = 1000 * 60 * 5;

export function useWomStats() {
  return useQuery({
    queryKey: queryKeys.home.womStats(),
    queryFn: membersApi.getWomStats,
    staleTime: STALE,
  });
}

export function useClanStats() {
  return useQuery({
    queryKey: queryKeys.home.clanVault(),
    queryFn: membersApi.getClanStats,
    staleTime: STALE,
  });
}

export function useRecentAchievements() {
  return useQuery({
    queryKey: queryKeys.home.achievements(),
    queryFn: () => membersApi.getRecentAchievements(20),
    staleTime: STALE,
  });
}

export function useHomeCompetitions() {
  return useQuery({
    queryKey: queryKeys.home.competitions(),
    queryFn: membersApi.getCompetitions,
    staleTime: STALE,
  });
}
