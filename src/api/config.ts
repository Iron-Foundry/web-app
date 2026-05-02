import { apiFetch } from "./client";
import type { PingRole } from "@/types/parties";

interface RankMapping {
  discord_role_id: string;
  label: string;
  ingame_rank: string | null;
}

interface RankingConfig {
  [key: string]: unknown;
}

interface RankingStatus {
  is_running: boolean;
  last_run_at: string | null;
  player_count: number;
  last_error: string | null;
  service_active: boolean;
}

interface RankingResult {
  [key: string]: unknown;
}

export const configApi = {
  getRankMappings: () => apiFetch<RankMapping[]>("/config/rank-mappings"),

  updateRankMappings: (data: RankMapping[]) =>
    apiFetch<void>("/config/rank-mappings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getPartyPingRoles: () => apiFetch<PingRole[]>("/config/party-ping-roles"),

  updatePartyPingRoles: (data: PingRole[]) =>
    apiFetch<void>("/config/party-ping-roles", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getRankingConfig: () => apiFetch<RankingConfig>("/config/ranking"),

  updateRankingConfig: (data: RankingConfig) =>
    apiFetch<void>("/config/ranking", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getRankingStatus: () => apiFetch<RankingStatus>("/ranking/status"),

  runRanking: () => apiFetch<void>("/ranking/run", { method: "POST" }),

  getRankingResults: (params: string) =>
    apiFetch<RankingResult[]>(`/ranking/results?${params}`),

  previewRanking: (data: unknown) =>
    apiFetch<unknown>("/ranking/preview", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
