import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { frenzyApi } from "@/api/frenzy";
import { queryKeys } from "@/lib/queryKeys";

const STALE_5M = 1000 * 60 * 5;

export function useEvents() {
  return useQuery({
    queryKey: queryKeys.frenzy.events(),
    queryFn: frenzyApi.listEvents,
    staleTime: STALE_5M,
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: queryKeys.frenzy.event(id),
    queryFn: () => frenzyApi.getEvent(id),
    staleTime: STALE_5M,
    enabled: id > 0,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: frenzyApi.createEvent,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.events() }),
  });
}

export function usePatchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof frenzyApi.patchEvent>[1] }) =>
      frenzyApi.patchEvent(id, data),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.events() });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(id) });
    },
  });
}

function useEventListMutation(mutationFn: (id: number) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.events() });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}

export function useDeleteEvent() {
  return useEventListMutation(frenzyApi.deleteEvent);
}

export function useActivateEvent() {
  return useEventListMutation(frenzyApi.activateEvent);
}

export function useDeactivateEvent() {
  return useEventListMutation(frenzyApi.deactivateEvent);
}

export function useAddTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: Parameters<typeof frenzyApi.addTeam>[1] }) =>
      frenzyApi.addTeam(eventId, data),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}

export function usePatchTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      slug,
      data,
    }: {
      eventId: number;
      slug: string;
      data: Parameters<typeof frenzyApi.patchTeam>[2];
    }) => frenzyApi.patchTeam(eventId, slug, data),
    onSuccess: (_result, { eventId, slug }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.team(slug) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, slug }: { eventId: number; slug: string }) =>
      frenzyApi.deleteTeam(eventId, slug),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}

export function useSyncEventFromWom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) => frenzyApi.syncEventFromWom(eventId),
    onSuccess: (_result, eventId) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.events() });
    },
  });
}
