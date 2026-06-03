import { apiFetch } from "./client";
import type { PbEntry, ClogEntry, KcBoss, LeaguesEntry, RankingResults, RankingStats } from "@/types/leaderboard";

export const leaderboardsApi = {
  getPbs: () => apiFetch<PbEntry[]>("/clan/leaderboards"),
  getCollectionLog: () => apiFetch<ClogEntry[]>("/clan/leaderboards/collection-log"),
  getKillcounts: () => apiFetch<KcBoss[]>("/clan/leaderboards/killcounts"),
  getLeagues: () => apiFetch<LeaguesEntry[]>("/clan/leaderboards/leagues"),
  getRankingResults: (skip: number, limit: number, rankFilter?: string) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (rankFilter) params.set("rank_filter", rankFilter);
    return apiFetch<RankingResults>(`/ranking/results?${params}`);
  },
  getRankingStats: () => apiFetch<RankingStats>("/ranking/stats"),
};
