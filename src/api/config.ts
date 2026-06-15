import { apiFetch } from "./client";
import type { NotificationCategory } from "@/types/parties";

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

export interface TicketFeaturesConfig {
  rank_pull_set_primary: boolean;
}

export interface ChannelEntry {
  channel_id: string;
  description: string;
  emoji: string;
}

export interface LinkEntry {
  label: string;
  url: string;
}

export type SectionType =
  | "header_image"
  | "server_stats"
  | "free_text"
  | "channel_toc"
  | "name_changes"
  | "achievements"
  | "website_links"
  | "personal_bests"
  | "competitions";

export interface HeaderImageSection { type: "header_image"; image_url: string }
export interface ServerStatsSection { type: "server_stats" }
export interface FreeTextSection { type: "free_text"; content: string }
export interface ChannelTocSection { type: "channel_toc"; channels: ChannelEntry[] }
export interface NameChangesSection { type: "name_changes"; count: number }
export interface AchievementsSection { type: "achievements"; count: number }
export interface WebsiteLinksSection { type: "website_links"; links: LinkEntry[] }
export interface PersonalBestsSection { type: "personal_bests"; count: number }
export interface CompetitionsSection { type: "competitions" }

export type PanelSection =
  | HeaderImageSection
  | ServerStatsSection
  | FreeTextSection
  | ChannelTocSection
  | NameChangesSection
  | AchievementsSection
  | WebsiteLinksSection
  | PersonalBestsSection
  | CompetitionsSection;

export interface PanelMessage {
  sections: PanelSection[];
}

export interface InfoPanelConfig {
  channel_id: number | null;
  refresh_interval_minutes: number;
  messages: PanelMessage[];
}

export const configApi = {
  getRankMappings: () => apiFetch<RankMapping[]>("/config/rank-mappings"),

  updateRankMappings: (data: RankMapping[]) =>
    apiFetch<void>("/config/rank-mappings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getNotificationCategories: () =>
    apiFetch<{ categories: NotificationCategory[] }>(
      "/config/party-notification-categories"
    ).then((d) => d.categories),

  updateNotificationCategories: (data: NotificationCategory[]) =>
    apiFetch<{ categories: NotificationCategory[] }>(
      "/config/party-notification-categories",
      {
        method: "PUT",
        body: JSON.stringify({ categories: data }),
      }
    ),

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

  getTicketFeatures: () => apiFetch<TicketFeaturesConfig>("/config/ticket-features"),

  updateTicketFeatures: (data: TicketFeaturesConfig) =>
    apiFetch<TicketFeaturesConfig>("/config/ticket-features", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getPanelConfig: () => apiFetch<InfoPanelConfig>("/config/panel"),

  updatePanelConfig: (data: InfoPanelConfig) =>
    apiFetch<InfoPanelConfig>("/config/panel", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
