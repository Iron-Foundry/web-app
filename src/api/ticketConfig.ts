import { apiFetch } from "./client";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { ApiRequestError } from "./client";

export interface ImageInfo {
  name: string;
  filename: string;
}

export interface PanelConfig {
  images: ImageInfo[];
}

export interface TicketTypeConfig {
  type_id: string;
  display_name: string;
  description: string;
  emoji: string;
  color_hex: string;
  enabled: boolean;
  max_open_per_user: number;
  welcome_text: string;
  images: ImageInfo[];
}

type TicketTypeConfigPatch = Partial<
  Pick<
    TicketTypeConfig,
    | "display_name"
    | "description"
    | "emoji"
    | "color_hex"
    | "enabled"
    | "max_open_per_user"
    | "welcome_text"
  >
>;

export const ticketConfigApi = {
  list: () => apiFetch<TicketTypeConfig[]>("/tickets/config"),
  getPanel: () => apiFetch<PanelConfig>("/tickets/config/panel"),

  patch: (typeId: string, data: TicketTypeConfigPatch) =>
    apiFetch<TicketTypeConfig>(`/tickets/config/${typeId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  uploadImage: async (typeId: string, name: string, file: File): Promise<ImageInfo> => {
    const form = new FormData();
    form.append("name", name);
    form.append("file", file);
    const res = await fetch(`${API_URL}/tickets/config/${typeId}/images`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: form,
    });
    if (!res.ok) {
      let body: unknown;
      try { body = await res.json(); } catch { /* empty */ }
      const msg = (body as { detail?: string } | null)?.detail ?? res.statusText;
      throw new ApiRequestError(res.status, "UPLOAD_ERROR", msg, body);
    }
    return res.json() as Promise<ImageInfo>;
  },

  deleteImage: (typeId: string, name: string) =>
    apiFetch<void>(`/tickets/config/${typeId}/images/${name}`, { method: "DELETE" }),
};
