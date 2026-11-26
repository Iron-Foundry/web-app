import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { frenzyApi } from "@/api/frenzy";
import { queryKeys } from "@/lib/queryKeys";

const STALE_5M = 1000 * 60 * 5;
const STALE_24H = 1000 * 60 * 60 * 24;

// Public
export function useActiveEvent() {
  return useQuery({
    queryKey: queryKeys.frenzy.active(),
    queryFn: frenzyApi.getActiveEvent,
    staleTime: STALE_5M,
  });
}

export function useActiveBoard(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.frenzy.activeBoard(),
    queryFn: frenzyApi.getActiveBoard,
    staleTime: STALE_5M,
    enabled,
  });
}

export function useActiveSignups(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.frenzy.activeSignups(),
    queryFn: frenzyApi.getActiveSignups,
    staleTime: 1000 * 60,
    enabled,
  });
}

export function useTeamDetail(teamSlug: string) {
  return useQuery({
    queryKey: queryKeys.frenzy.team(teamSlug),
    queryFn: () => frenzyApi.getTeamDetail(teamSlug),
    staleTime: STALE_5M,
    enabled: !!teamSlug,
  });
}

export function useFrenzyLeaderboards() {
  return useQuery({
    queryKey: queryKeys.frenzy.leaderboards(),
    queryFn: frenzyApi.getLeaderboards,
    staleTime: STALE_5M,
  });
}

// OSRS reference data
export function useOsrsItems(q: string) {
  return useQuery({
    queryKey: queryKeys.frenzy.osrsItems(q),
    queryFn: () => frenzyApi.searchItems(q),
    staleTime: STALE_24H,
    placeholderData: keepPreviousData,
    enabled: q.length >= 2,
  });
}

export function useOsrsBosses() {
  return useQuery({
    queryKey: queryKeys.frenzy.osrsBosses(),
    queryFn: frenzyApi.getBosses,
    staleTime: STALE_24H,
  });
}

export function useOsrsActivities() {
  return useQuery({
    queryKey: queryKeys.frenzy.osrsActivities(),
    queryFn: frenzyApi.getActivities,
    staleTime: STALE_24H,
  });
}

// History / charts
export function useTeamHistory(teamSlug: string) {
  return useQuery({
    queryKey: queryKeys.frenzy.teamHistory(teamSlug),
    queryFn: () => frenzyApi.getTeamHistory(teamSlug),
    staleTime: STALE_5M,
    enabled: !!teamSlug,
  });
}

export function useEventHistory() {
  return useQuery({
    queryKey: queryKeys.frenzy.eventHistory(),
    queryFn: frenzyApi.getEventHistory,
    staleTime: STALE_5M,
  });
}
