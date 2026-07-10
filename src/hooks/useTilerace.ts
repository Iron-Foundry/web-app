import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tileraceApi } from "@/api/tilerace";
import { queryKeys } from "@/lib/queryKeys";
import type { RepositoryTile, TileRaceEventCreate, TileRaceEventPatch, TileRaceTeamCreate, TileTag } from "@/types/tilerace";

const STALE_5M = 1000 * 60 * 5;
const STALE_24H = 1000 * 60 * 60 * 24;

// Public
export function useActiveTileraceEvent() {
  return useQuery({
    queryKey: queryKeys.tilerace.active(),
    queryFn: tileraceApi.getActiveEvent,
    staleTime: STALE_5M,
  });
}

export function useTileraceEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.tilerace.event(id),
    queryFn: () => tileraceApi.getEvent(id),
    staleTime: STALE_5M,
    enabled: !!id,
  });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => tileraceApi.signUp(eventId),
    onSuccess: (_result, eventId) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
    },
  });
}

export function useCancelSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => tileraceApi.cancelSignup(eventId),
    onSuccess: (_result, eventId) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
    },
  });
}

// Repository
export function useTiles(params?: { tag?: TileTag; search?: string }) {
  const paramsKey = JSON.stringify(params ?? {});
  return useQuery({
    queryKey: queryKeys.tilerace.tiles(paramsKey),
    queryFn: () => tileraceApi.listTiles(params),
    staleTime: STALE_24H,
  });
}

export function useTile(id: string) {
  return useQuery({
    queryKey: queryKeys.tilerace.tile(id),
    queryFn: () => tileraceApi.getTile(id),
    staleTime: STALE_24H,
    enabled: !!id,
  });
}

export function useCreateTile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RepositoryTile, "id" | "created_at" | "updated_at">) =>
      tileraceApi.createTile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tilerace.tiles() }),
  });
}

export function useUpdateTile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<RepositoryTile, "id" | "created_at" | "updated_at">>;
    }) => tileraceApi.updateTile(id, data),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.tiles() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.tile(id) });
    },
  });
}

export function useDeleteTile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tileraceApi.deleteTile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tilerace.tiles() }),
  });
}

// Admin - Events
export function useTileraceEvents() {
  return useQuery({
    queryKey: queryKeys.tilerace.events(),
    queryFn: tileraceApi.listEvents,
    staleTime: STALE_5M,
  });
}

export function useCreateTileraceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TileRaceEventCreate) => tileraceApi.createEvent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tilerace.events() }),
  });
}

export function usePatchTileraceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TileRaceEventPatch }) =>
      tileraceApi.patchEvent(id, data),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.events() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(id) });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
    },
  });
}

export function useDeleteTileraceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tileraceApi.deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.events() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
    },
  });
}

export function useActivateTileraceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tileraceApi.activateEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.events() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
    },
  });
}

export function useDeactivateTileraceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tileraceApi.deactivateEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.events() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
    },
  });
}

// Admin - Teams
export function useAddTileraceTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: TileRaceTeamCreate }) =>
      tileraceApi.addTeam(eventId, data),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
    },
  });
}

export function usePatchTileraceTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      teamId,
      data,
    }: {
      eventId: string;
      teamId: string;
      data: Parameters<typeof tileraceApi.patchTeam>[2];
    }) => tileraceApi.patchTeam(eventId, teamId, data),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
    },
  });
}

export function useDeleteTileraceTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, teamId }: { eventId: string; teamId: string }) =>
      tileraceApi.deleteTeam(eventId, teamId),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
    },
  });
}

export function useScrambleTileraceTeams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => tileraceApi.scrambleTeams(eventId),
    onSuccess: (_result, eventId) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
    },
  });
}

// Controls
export function useRollDice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      teamId,
      roll,
    }: {
      eventId: string;
      teamId: string;
      roll: number;
    }) => tileraceApi.rollDice(eventId, teamId, roll),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
    },
  });
}

export function useSetFogOfWar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, enabled }: { eventId: string; enabled: boolean }) =>
      tileraceApi.setFogOfWar(eventId, enabled),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
    },
  });
}
