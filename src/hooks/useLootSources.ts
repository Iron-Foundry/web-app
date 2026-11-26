import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  osrsclansApi,
  SOURCE_PAGE_SIZE,
  type KillRate,
  type LootCategory,
  type LootRateRow,
} from "@/api/osrsclans";
import { queryKeys } from "@/lib/queryKeys";

const STALE_1H = 1000 * 60 * 60;

/** The drop sources of one category, one page of 100 at a time, for a virtual list. */
export function useLootSources(category: LootCategory, q: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.reference.lootSources(category, q),
    queryFn: ({ pageParam }) => osrsclansApi.lootSources({ category, q, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.offset + SOURCE_PAGE_SIZE < last.total ? last.offset + SOURCE_PAGE_SIZE : undefined),
    staleTime: STALE_1H,
  });
}

/** All loot rate rows of one drop source: its drop table. */
export function useSourceRates(source: string | null): UseQueryResult<LootRateRow[]> {
  return useQuery({
    queryKey: queryKeys.reference.sourceRates(source ?? ""),
    queryFn: () => osrsclansApi.sourceRates(source as string),
    select: (page) => page.items,
    enabled: source !== null,
    staleTime: STALE_1H,
  });
}

/** The staff-set kill rate of a source whose rate is marked foundry. */
export function useKillRate(source: string | null): UseQueryResult<KillRate> {
  return useQuery({
    queryKey: queryKeys.reference.killRate(source ?? ""),
    queryFn: () => osrsclansApi.killRate(source as string),
    enabled: source !== null,
  });
}

function useKillRateMutation<T>(mutationFn: (vars: T & { source: string }) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_result, { source }) => {
      qc.invalidateQueries({ queryKey: queryKeys.reference.killRate(source) });
      qc.invalidateQueries({ queryKey: queryKeys.reference.lootSourcesAll() });
      qc.invalidateQueries({ queryKey: queryKeys.reference.sourceRates(source) });
    },
  });
}

export function useSetKillRate() {
  return useKillRateMutation<{ killsPerHour: number }>(({ source, killsPerHour }) =>
    osrsclansApi.setKillRate(source, killsPerHour),
  );
}

export function useRemoveKillRate() {
  return useKillRateMutation<object>(({ source }) => osrsclansApi.removeKillRate(source));
}
