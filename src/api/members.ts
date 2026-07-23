import { apiFetch } from "./client";
import type { PlayerBadge, FeedItem, MeStats, NameChange, WomStatsResponse, Achievement, AccountRanking, PlayerSnapshot } from "@/types/members";
import type { Goal } from "@/types/goals";
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

  getMeStats: () => apiFetch<MeStats>("/members/me/stats"),

  getMyRankings: () => apiFetch<AccountRanking[]>("/members/me/rankings"),

  getNameChanges: () => apiFetch<NameChange[]>("/clan/name-changes"),

  getWomStats: () => apiFetch<WomStatsResponse>("/clan/wom-stats"),

  getClanStats: () => apiFetch<ClanVaultStats>("/clan/stats"),

  getRecentAchievements: (limit = 20) =>
    apiFetch<Achievement[]>(`/clan/recent-achievements?limit=${limit}`),

  getCompetitions: () => apiFetch<Competition[]>("/clan/competitions"),

  getApiKey: () => apiFetch<ApiKey>("/members/me/api-key"),

  rotateApiKey: () => apiFetch<ApiKey>("/members/me/api-key/rotate", { method: "POST" }),

  getMySnapshot: (rsn: string) => apiFetch<PlayerSnapshot>(`/members/me/snapshot?rsn=${encodeURIComponent(rsn)}`),

  getMyGoals: (rsn: string) =>
    apiFetch<{ rsn: string; goals: Goal[]; share_token: string | null; updated_at: string | null }>(`/members/me/goals/${encodeURIComponent(rsn)}`),

  getGoalsByToken: (token: string) =>
    apiFetch<{ rsn: string; goals: Goal[]; updated_at: string | null }>(`/members/goals/${encodeURIComponent(token)}`),

  saveMyGoals: (rsn: string, goals: Goal[]) =>
    apiFetch<{ rsn: string; share_token: string; updated_at: string }>(`/members/me/goals/${encodeURIComponent(rsn)}`, {
      method: "PUT",
      body: JSON.stringify({ goals }),
    }),
};
