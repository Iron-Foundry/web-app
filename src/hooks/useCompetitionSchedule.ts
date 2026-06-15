import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { competitionScheduleApi } from "@/api/competitionSchedule";
import type {
  CreateScheduleInput,
  OverrideOptionsInput,
  PatchRunInput,
  PatchScheduleInput,
} from "@/types/competitionSchedule";
import { queryKeys } from "@/lib/queryKeys";

const POLL_INTERVAL = 1000 * 15;

export function useScheduleList() {
  return useQuery({
    queryKey: queryKeys.compSchedule.list(),
    queryFn: competitionScheduleApi.list,
    staleTime: 0,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useSchedule(id: number) {
  return useQuery({
    queryKey: queryKeys.compSchedule.detail(id),
    queryFn: () => competitionScheduleApi.get(id),
    staleTime: 0,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useScheduleRuns(id: number, status?: string) {
  return useQuery({
    queryKey: queryKeys.compSchedule.runs(id, status),
    queryFn: () => competitionScheduleApi.getRuns(id, { status }),
    staleTime: 0,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScheduleInput) => competitionScheduleApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.compSchedule.list() }),
  });
}

export function useUpdateSchedule(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PatchScheduleInput) => competitionScheduleApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comp-schedule"] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => competitionScheduleApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.compSchedule.list() }),
  });
}

export function usePauseSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => competitionScheduleApi.pause(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.compSchedule.list() }),
  });
}

export function useResumeSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => competitionScheduleApi.resume(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.compSchedule.list() }),
  });
}

export function useSkipNext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => competitionScheduleApi.skipNext(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.compSchedule.list() }),
  });
}

export function useTriggerNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => competitionScheduleApi.triggerNow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.compSchedule.list() }),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePatchRun(scheduleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, data }: { runId: number; data: PatchRunInput }) =>
      competitionScheduleApi.patchRun(scheduleId, runId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comp-schedule"] }),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useOverrideOptions(scheduleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OverrideOptionsInput) =>
      competitionScheduleApi.overrideOptions(scheduleId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comp-schedule"] }),
  });
}
