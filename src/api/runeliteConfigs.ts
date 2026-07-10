import { apiFetch } from "./client";
import type { RuneLiteConfig, RuneLiteConfigBody } from "@/types/runeliteConfig";

export const runeliteConfigsApi = {
  list: (type?: string): Promise<RuneLiteConfig[]> =>
    apiFetch(type ? `/runelite-configs?type=${encodeURIComponent(type)}` : "/runelite-configs"),

  get: (id: string): Promise<RuneLiteConfig> =>
    apiFetch(`/runelite-configs/${id}`),

  create: (body: RuneLiteConfigBody): Promise<RuneLiteConfig> =>
    apiFetch("/runelite-configs", { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: RuneLiteConfigBody): Promise<RuneLiteConfig> =>
    apiFetch(`/runelite-configs/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  remove: (id: string): Promise<{ ok: boolean }> =>
    apiFetch(`/runelite-configs/${id}`, { method: "DELETE" }),
};
