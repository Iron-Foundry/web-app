import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { competitionsApi } from "@/api/competitions";
import type { CreateCompetitionInput, EditCompetitionInput } from "@/types/competitions";
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

export function useParticipantSuggestions() {
  return useQuery({
    queryKey: ["competitions", "participants"],
    queryFn: competitionsApi.getParticipants,
    staleTime: STALE,
  });
}

export function useCreateCompetition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompetitionInput) => competitionsApi.create(data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.competitions.list() }),
  });
}

export function useUpdateCompetition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditCompetitionInput }) =>
      competitionsApi.update(id, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.competitions.list() }),
  });
}

export function useDeleteCompetition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => competitionsApi.delete(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.competitions.list() }),
  });
}
