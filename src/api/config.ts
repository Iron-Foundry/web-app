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

export interface DiscordRolesConfig {
  staff_role_id: string;
  senior_staff_role_id: string;
  owner_role_id: string;
  mentor_role_id: string;
}

export interface ActionLogFeatureConfig {
  forum_channel_id: string;
  enabled: boolean;
}

export interface BroadcastFeatureConfig {
  role_id: string;
}

export interface JoinRolesFeatureConfig {
  role_ids: string[];
}

export interface PartyPanelFeatureConfig {
  channel_id: string;
  message_id: string;
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

  getDiscordRoles: () => apiFetch<DiscordRolesConfig>("/config/discord-roles"),

  updateDiscordRoles: (data: DiscordRolesConfig) =>
    apiFetch<DiscordRolesConfig>("/config/discord-roles", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getActionLogConfig: () => apiFetch<ActionLogFeatureConfig>("/config/discord-feature/action-log"),

  updateActionLogConfig: (data: ActionLogFeatureConfig) =>
    apiFetch<ActionLogFeatureConfig>("/config/discord-feature/action-log", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getBroadcastConfig: () => apiFetch<BroadcastFeatureConfig>("/config/discord-feature/broadcast"),

  updateBroadcastConfig: (data: BroadcastFeatureConfig) =>
    apiFetch<BroadcastFeatureConfig>("/config/discord-feature/broadcast", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getJoinRolesConfig: () => apiFetch<JoinRolesFeatureConfig>("/config/discord-feature/join-roles"),

  updateJoinRolesConfig: (data: JoinRolesFeatureConfig) =>
    apiFetch<JoinRolesFeatureConfig>("/config/discord-feature/join-roles", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getPartyPanelConfig: () => apiFetch<PartyPanelFeatureConfig>("/config/discord-feature/party-panel"),
};
