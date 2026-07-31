import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tileraceApi } from "@/api/tilerace";
import { queryKeys } from "@/lib/queryKeys";
import type {
  GenerateTeamsOptions,
  RepositoryTile,
  RosterAdd,
  RosterPatch,
  SabotageAction,
  TileRaceEventCreate,
  TileRaceEventPatch,
  TileRaceTeamCreate,
  TileTag,
} from "@/types/tilerace";

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

interface SignupVars {
  eventId: string;
  accountId: number;
  wantsCaptain: boolean;
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: SignupVars) =>
      tileraceApi.signUp(vars.eventId, vars.accountId, vars.wantsCaptain),
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
      qc.invalidateQueries({
        queryKey: queryKeys.tilerace.event(vars.eventId),
      });
    },
  });
}

export function useChangeSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: SignupVars) =>
      tileraceApi.changeSignup(vars.eventId, vars.accountId, vars.wantsCaptain),
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
      qc.invalidateQueries({
        queryKey: queryKeys.tilerace.event(vars.eventId),
      });
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
    mutationFn: (
      data: Omit<RepositoryTile, "id" | "created_at" | "updated_at">,
    ) => tileraceApi.createTile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tilerace", "tiles"] }),
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
      qc.invalidateQueries({ queryKey: ["tilerace", "tiles"] });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.tile(id) });
    },
  });
}

export function useDeleteTile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tileraceApi.deleteTile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tilerace", "tiles"] }),
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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.events() }),
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
    mutationFn: ({
      eventId,
      data,
    }: {
      eventId: string;
      data: TileRaceTeamCreate;
    }) => tileraceApi.addTeam(eventId, data),
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

function useRosterInvalidation() {
  const qc = useQueryClient();
  return (eventId: string): void => {
    qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
    qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
    qc.invalidateQueries({ queryKey: ["tilerace", "candidates", eventId] });
  };
}

export function useGenerateTileraceTeams() {
  const invalidate = useRosterInvalidation();
  return useMutation({
    mutationFn: ({
      eventId,
      options,
    }: {
      eventId: string;
      options: GenerateTeamsOptions;
    }) => tileraceApi.generateTeams(eventId, options),
    onSuccess: (_result, { eventId }) => invalidate(eventId),
  });
}

export function useResetTileraceTeams() {
  const invalidate = useRosterInvalidation();
  return useMutation({
    mutationFn: (eventId: string) => tileraceApi.resetTeams(eventId),
    onSuccess: (_result, eventId) => invalidate(eventId),
  });
}

// Admin - Roster
export function useTileraceCandidates(eventId: string, search: string) {
  return useQuery({
    queryKey: queryKeys.tilerace.candidates(eventId, search),
    queryFn: () => tileraceApi.listCandidates(eventId, search),
    staleTime: STALE_5M,
    enabled: !!eventId,
  });
}

export function useAddRosterMember() {
  const invalidate = useRosterInvalidation();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: RosterAdd }) =>
      tileraceApi.addRosterMember(eventId, data),
    onSuccess: (_result, { eventId }) => invalidate(eventId),
  });
}

export function usePatchRosterMember() {
  const invalidate = useRosterInvalidation();
  return useMutation({
    mutationFn: ({
      eventId,
      discordUserId,
      data,
    }: {
      eventId: string;
      discordUserId: string;
      data: RosterPatch;
    }) => tileraceApi.patchRosterMember(eventId, discordUserId, data),
    onSuccess: (_result, { eventId }) => invalidate(eventId),
  });
}

export function useRemoveRosterMember() {
  const invalidate = useRosterInvalidation();
  return useMutation({
    mutationFn: ({
      eventId,
      discordUserId,
    }: {
      eventId: string;
      discordUserId: string;
    }) => tileraceApi.removeRosterMember(eventId, discordUserId),
    onSuccess: (_result, { eventId }) => invalidate(eventId),
  });
}

// Controls
export function useRollDice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, teamId }: { eventId: string; teamId: string }) =>
      tileraceApi.rollDice(eventId, teamId),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.rolls(eventId) });
    },
  });
}

const ROLLS_POLL_MS = 3000;

export function useRecentRolls(eventId: string) {
  return useQuery({
    queryKey: queryKeys.tilerace.rolls(eventId),
    queryFn: () => tileraceApi.listRolls(eventId),
    staleTime: 0,
    refetchInterval: ROLLS_POLL_MS,
    enabled: !!eventId,
  });
}

function useDiscordProvisioning(
  action: (eventId: string) => Promise<unknown>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => action(eventId),
    onSuccess: (_result, eventId) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
    },
  });
}

export function useSetupTileraceDiscord() {
  return useDiscordProvisioning(tileraceApi.setupDiscord);
}

export function useSyncTileraceDiscord() {
  return useDiscordProvisioning(tileraceApi.syncDiscord);
}

export function useTeardownTileraceDiscord() {
  return useDiscordProvisioning(tileraceApi.teardownDiscord);
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

// Completions
export function useCompletions(eventId: string) {
  return useQuery({
    queryKey: queryKeys.tilerace.completions(eventId),
    queryFn: () => tileraceApi.listCompletions(eventId),
    staleTime: STALE_5M,
    enabled: !!eventId,
  });
}

export function useToggleCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      teamId,
      pathPosition,
      completed,
    }: {
      eventId: string;
      teamId: string;
      pathPosition: number;
      completed: boolean;
    }) =>
      tileraceApi.toggleCompletion(eventId, teamId, pathPosition, completed),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.tilerace.completions(eventId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
    },
  });
}

export function useSabotage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      teamId,
      action,
      targetTeamId,
      amount,
    }: {
      eventId: string;
      teamId: string;
      action: SabotageAction;
      targetTeamId: string;
      amount: number;
    }) =>
      tileraceApi.sabotage(eventId, teamId, {
        action,
        target_team_id: targetTeamId,
        amount,
      }),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
    },
  });
}
