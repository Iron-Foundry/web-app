import { useQuery } from "@tanstack/react-query";
import { membersApi } from "@/api/members";
import { queryKeys } from "@/lib/queryKeys";

export function useMyBadges(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members.badges(),
    queryFn: membersApi.getMyBadges,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMyFeed(rsn: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.members.feed(),
    queryFn: () => membersApi.getFeed(50),
    enabled: !!rsn,
    staleTime: 1000 * 60 * 2,
  });
}

export function useNameChanges() {
  return useQuery({
    queryKey: queryKeys.members.nameChanges(),
    queryFn: membersApi.getNameChanges,
    staleTime: 1000 * 60 * 15,
  });
}

export function useDashboardCompetitions() {
  return useQuery({
    queryKey: queryKeys.competitions.list(),
    queryFn: membersApi.getCompetitions,
    staleTime: 1000 * 60 * 5,
    select: (data) =>
      [...data].sort((a, b) => {
        const o: Record<string, number> = { ongoing: 0, upcoming: 1, finished: 2 };
        return (o[a.status] ?? 3) - (o[b.status] ?? 3);
      }),
  });
}
