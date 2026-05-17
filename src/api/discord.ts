import { apiFetch } from "./client";

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

export interface DiscordChannelCategory {
  id: string;
  name: string;
  channels: DiscordChannel[];
}

export interface DiscordChannelsResponse {
  categories: DiscordChannelCategory[];
  uncategorized: DiscordChannel[];
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

export interface GuildEmoji {
  id: string;
  name: string;
  animated: boolean;
}

export interface SelectableRole {
  role_id: string;
  label: string;
  description: string;
  emoji: string | null;
}

export interface RolePanel {
  panel_id: string;
  guild_id: string;
  channel_id: string;
  message_id: string;
  title: string;
  description: string;
  max_selectable: number | null;
  roles: SelectableRole[];
  created_at: string;
  updated_at: string;
}

export interface RolePanelUpdate {
  title: string;
  description: string;
  max_selectable: number | null;
  roles: SelectableRole[];
}

export const discordApi = {
  getChannels: () => apiFetch<DiscordChannelsResponse>("/discord/channels"),
  getRoles: () => apiFetch<{ roles: DiscordRole[] }>("/discord/roles"),
  getEmojis: () => apiFetch<{ emojis: GuildEmoji[] }>("/discord/emojis"),

  listRolePanels: () => apiFetch<{ panels: RolePanel[] }>("/role-panels"),

  updateRolePanel: (panelId: string, data: RolePanelUpdate) =>
    apiFetch<RolePanel>(`/role-panels/${panelId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteRolePanel: (panelId: string) =>
    apiFetch<{ deleted: string }>(`/role-panels/${panelId}`, { method: "DELETE" }),
};
