import { apiFetch } from "./client";
import type { Party, ChatMessage, NotificationCategory, Vibe } from "@/types/parties";

interface CreatePartyPayload {
  activity: string;
  description: string | null;
  vibe: Vibe;
  max_size: number;
  ttl_hours: number;
  scheduled_at: string | null;
  notification_category_ids: string[];
  rsn_override?: string | null;
}

interface UpdatePartyPayload {
  activity?: string;
  description?: string | null;
  vibe?: Vibe;
  max_size?: number;
  scheduled_at?: string | null;
  notification_category_ids?: string[];
}

export const partiesApi = {
  list: () => apiFetch<Party[]>("/parties"),

  create: (data: CreatePartyPayload) =>
    apiFetch<Party>("/parties", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: UpdatePartyPayload) =>
    apiFetch<Party>(`/parties/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) => apiFetch<void>(`/parties/${id}`, { method: "DELETE" }),

  join: (id: string, rsn_override?: string | null) =>
    apiFetch<void>(`/parties/${id}/join`, {
      method: "POST",
      body: rsn_override ? JSON.stringify({ rsn_override }) : undefined,
    }),

  leave: (id: string) => apiFetch<void>(`/parties/${id}/leave`, { method: "DELETE" }),

  kickMember: (partyId: string, userId: string) =>
    apiFetch<void>(`/parties/${partyId}/members/${userId}`, { method: "DELETE" }),

  getChat: (partyId: string) => apiFetch<ChatMessage[]>(`/parties/${partyId}/chat`),

  sendMessage: (partyId: string, text: string) =>
    apiFetch<ChatMessage>(`/parties/${partyId}/chat`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  getNotificationPreferences: () =>
    apiFetch<{ category_ids: string[] }>("/parties/notifications"),

  updateNotificationPreferences: (data: { category_ids: string[] }) =>
    apiFetch<{ category_ids: string[] }>("/parties/notifications", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getNotificationCategories: () =>
    apiFetch<{ categories: NotificationCategory[] }>(
      "/config/party-notification-categories"
    ).then((d) => d.categories),
};
