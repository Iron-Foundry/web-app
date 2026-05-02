import { apiFetch } from "./client";
import type { Party, ChatMessage, PingRole, Vibe } from "@/types/parties";

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
  activity?: string;
  description?: string | null;
  vibe?: Vibe;
  max_size?: number;
  scheduled_at?: string | null;
  ping_role_ids?: string[];
}

export const partiesApi = {
  list: () => apiFetch<Party[]>("/parties"),

  create: (data: CreatePartyPayload) =>
    apiFetch<Party>("/parties", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: UpdatePartyPayload) =>
    apiFetch<Party>(`/parties/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) => apiFetch<void>(`/parties/${id}`, { method: "DELETE" }),

  join: (id: string) => apiFetch<void>(`/parties/${id}/join`, { method: "POST" }),

  leave: (id: string) => apiFetch<void>(`/parties/${id}/leave`, { method: "DELETE" }),

  kickMember: (partyId: string, userId: string) =>
    apiFetch<void>(`/parties/${partyId}/members/${userId}`, { method: "DELETE" }),

  getChat: (partyId: string) => apiFetch<ChatMessage[]>(`/parties/${partyId}/chat`),

  sendMessage: (partyId: string, text: string) =>
    apiFetch<ChatMessage>(`/parties/${partyId}/chat`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  getPingRoles: () =>
    apiFetch<{ roles: PingRole[] }>("/config/party-ping-roles").then((d) => d.roles),
};
