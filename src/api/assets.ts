import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { ApiRequestError } from "./client";
import type { Asset, UploadResponse } from "@/types/assets";

export const assetsApi = {
  list: async (): Promise<Asset[]> => {
    const res = await fetch(`${API_URL}/assets`, { headers: getAuthHeaders() });
    if (!res.ok) throw new ApiRequestError(res.status, "UNKNOWN", res.statusText);
    return res.json() as Promise<Asset[]>;
  },

  upload: async (file: File): Promise<UploadResponse> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/assets/upload`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: form,
    });
    if (!res.ok) {
      let body: unknown;
      try { body = await res.json(); } catch {}
      throw new ApiRequestError(
        res.status,
        (body as { code?: string } | null)?.code ?? "UNKNOWN",
        (body as { message?: string } | null)?.message ?? res.statusText,
        body,
      );
    }
    return res.json() as Promise<UploadResponse>;
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/assets/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new ApiRequestError(res.status, "UNKNOWN", res.statusText);
  },
};
