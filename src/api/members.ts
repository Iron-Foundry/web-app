import { apiFetch } from "./client";
import type { PlayerBadge, FeedItem, NameChange, WomStatsResponse, Achievement } from "@/types/members";
import type { Competition } from "@/types/competitions";

interface ClanVaultStats {
  total_gp: number;
  collection_log_items: number;
}

interface ApiKey {
  key: string;
  created_at: string;
}

export const membersApi = {
  getMyBadges: () => apiFetch<PlayerBadge[]>("/badges/me"),

  getFeed: (limit = 50) => apiFetch<FeedItem[]>(`/members/me/feed?limit=${limit}`),

  getNameChanges: () => apiFetch<NameChange[]>("/clan/name-changes"),

  getWomStats: () => apiFetch<WomStatsResponse>("/clan/wom-stats"),

  getClanStats: () => apiFetch<ClanVaultStats>("/clan/stats"),

  getRecentAchievements: (limit = 20) =>
    apiFetch<Achievement[]>(`/clan/recent-achievements?limit=${limit}`),

  getCompetitions: () => apiFetch<Competition[]>("/clan/competitions"),

  getApiKey: () => apiFetch<ApiKey>("/members/me/api-key"),

  rotateApiKey: () => apiFetch<ApiKey>("/members/me/api-key/rotate", { method: "POST" }),

  updateMe: (data: Record<string, unknown>) =>
    apiFetch<void>("/members/me", { method: "PATCH", body: JSON.stringify(data) }),
};
