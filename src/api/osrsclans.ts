import { apiFetch } from "@/api/client";
import type { components } from "@/api/schema";

export type LootRateRow = components["schemas"]["LootRate"];
export type LootRatePage = components["schemas"]["LootRatePage"];
export type LootSourceRow = components["schemas"]["LootSource"];
export type LootSourcePage = components["schemas"]["LootSourcePage"];
export type LootCategory = NonNullable<LootSourceRow["category"]>;
export type KillRate = components["schemas"]["KillRateOut"];
export type OsrsNpcPage = components["schemas"]["OsrsNpcPage"];
export type OsrsSpritePage = components["schemas"]["OsrsSpritePage"];

export interface LootSourceAsk {
  category: LootCategory;
  q: string;
  offset: number;
}

export const SOURCE_PAGE_SIZE = 100;

function sourceQuery({ category, q, offset }: LootSourceAsk): URLSearchParams {
  const params = new URLSearchParams({ category, limit: String(SOURCE_PAGE_SIZE), offset: String(offset) });
  if (q.length >= 2) params.set("q", q);
  return params;
}

function killRatePath(source: string): string {
  return `/reference/kill-rates/${encodeURIComponent(source)}`;
}

/** The OSRSClans data that api-backend proxies and caches under /reference. */
export const osrsclansApi = {
  lootRatesFor: (itemName: string) =>
    apiFetch<LootRatePage>(`/reference/loot-rates?${new URLSearchParams({ q: itemName, limit: "100" })}`),
  lootSources: (ask: LootSourceAsk) => apiFetch<LootSourcePage>(`/reference/loot-rates/sources?${sourceQuery(ask)}`),
  sourceRates: (source: string) =>
    apiFetch<LootRatePage>(`/reference/loot-rates?${new URLSearchParams({ source, limit: "500" })}`),
  setKillRate: (source: string, killsPerHour: number) =>
    apiFetch<KillRate>(killRatePath(source), { method: "PUT", body: JSON.stringify({ kills_per_hour: killsPerHour }) }),
  removeKillRate: (source: string) => apiFetch<undefined>(killRatePath(source), { method: "DELETE" }),
  killRate: (source: string) => apiFetch<KillRate>(killRatePath(source)),
  searchNpcs: (q: string) => apiFetch<OsrsNpcPage>(`/reference/osrs/npcs?${new URLSearchParams({ q, limit: "20" })}`),
  searchSprites: (q: string) =>
    apiFetch<OsrsSpritePage>(`/reference/osrs/sprites?${new URLSearchParams({ q, limit: "20" })}`),
};
