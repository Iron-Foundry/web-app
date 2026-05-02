import { useQuery } from "@tanstack/react-query";
import { competitionsApi } from "@/api/competitions";
import { queryKeys } from "@/lib/queryKeys";

const STALE = 1000 * 60 * 5;

export function useCompetitionList() {
  return useQuery({
    queryKey: queryKeys.competitions.list(),
    queryFn: competitionsApi.list,
    staleTime: STALE,
  });
}

export function useCompetitionMetricMap() {
  return useQuery({
    queryKey: queryKeys.competitions.metricMap(),
    queryFn: competitionsApi.getMetricMap,
    staleTime: STALE,
  });
}

export function useMetricDetail(competitionId: number | undefined, metric: string | undefined) {
  return useQuery({
    queryKey: queryKeys.competitions.metricDetail(competitionId ?? 0, metric ?? ""),
    queryFn: () => competitionsApi.getMetricDetail(competitionId!, metric!),
    enabled: !!competitionId && !!metric,
    staleTime: STALE,
  });
}
