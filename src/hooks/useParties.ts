import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { partiesApi } from "@/api/parties";
import { queryKeys } from "@/lib/queryKeys";
import type { Vibe } from "@/types/parties";

export function useParties() {
  return useQuery({
    queryKey: queryKeys.parties.list(),
    queryFn: partiesApi.list,
    refetchInterval: 500,
    staleTime: 0,
  });
}

export function usePartyChat(partyId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.parties.chat(partyId),
    queryFn: () => partiesApi.getChat(partyId),
    refetchInterval: enabled ? 500 : false,
    staleTime: 0,
    enabled,
  });
}

export function usePartyPingRoles(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.parties.pingRoles(),
    queryFn: partiesApi.getPingRoles,
    staleTime: 1000 * 60 * 10,
    enabled,
  });
}

interface CreatePartyPayload {
  activity: string;
  description: string | null;
  vibe: Vibe;
  max_size: number;
  ttl_hours: number;
  scheduled_at: string | null;
  ping_role_ids: string[];
}

interface UpdatePartyPayload {
  activity: string;
  description: string | null;
  vibe: Vibe;
  max_size: number;
  scheduled_at: string | null;
  ping_role_ids: string[];
}

export function useCreateParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePartyPayload) => partiesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.parties.list() }),
  });
}

export function useUpdateParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartyPayload }) =>
      partiesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.parties.list() }),
  });
}

export function useDeleteParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partiesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.parties.list() }),
  });
}

export function useJoinParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partiesApi.join(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.parties.list() }),
  });
}

export function useLeaveParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partiesApi.leave(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.parties.list() }),
  });
}

export function useKickPartyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partyId, userId }: { partyId: string; userId: string }) =>
      partiesApi.kickMember(partyId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.parties.list() }),
  });
}

export function useSendPartyMessage(partyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => partiesApi.sendMessage(partyId, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.parties.chat(partyId) }),
  });
}
