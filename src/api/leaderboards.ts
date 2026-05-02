import { apiFetch } from "./client";
import type { PbEntry, ClogEntry, KcBoss, LeaguesEntry } from "@/types/leaderboard";

export const leaderboardsApi = {
  getPbs: () => apiFetch<PbEntry[]>("/clan/leaderboards"),
  getCollectionLog: () => apiFetch<ClogEntry[]>("/clan/leaderboards/collection-log"),
  getKillcounts: () => apiFetch<KcBoss[]>("/clan/leaderboards/killcounts"),
  getLeagues: () => apiFetch<LeaguesEntry[]>("/clan/leaderboards/leagues"),
};
