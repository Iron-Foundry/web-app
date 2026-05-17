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

export const discordApi = {
  getChannels: () => apiFetch<DiscordChannelsResponse>("/discord/channels"),
  getRoles: () => apiFetch<{ roles: DiscordRole[] }>("/discord/roles"),
};
