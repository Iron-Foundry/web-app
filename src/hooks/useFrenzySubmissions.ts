import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { frenzySubmissionsApi, type SubmissionFilters } from "@/api/frenzySubmissions";
import { queryKeys } from "@/lib/queryKeys";

export type { SubmissionFilters } from "@/api/frenzySubmissions";

const STALE_5M = 1000 * 60 * 5;

export function useSubmissions(eventId: number, params?: SubmissionFilters) {
  const paramsKey = JSON.stringify(params ?? {});
  return useQuery({
    queryKey: queryKeys.frenzy.submissions(eventId, paramsKey),
    queryFn: () => frenzySubmissionsApi.listSubmissions(eventId, params),
    staleTime: STALE_5M,
    enabled: eventId > 0,
  });
}

export function usePatchSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      submissionId,
      data,
    }: {
      eventId: number;
      submissionId: number;
      data: { status: string; review_notes?: string | null };
    }) => frenzySubmissionsApi.patchSubmission(eventId, submissionId, data),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.submissions(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
      qc.invalidateQueries({ queryKey: ["frenzy", "active"] });
    },
  });
}

export function useDeleteSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      submissionId,
    }: {
      eventId: number;
      submissionId: number;
    }) => frenzySubmissionsApi.deleteSubmission(eventId, submissionId),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.submissions(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}
