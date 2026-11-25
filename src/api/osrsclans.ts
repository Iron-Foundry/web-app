import { apiFetch } from "@/api/client";
import type { components } from "@/api/schema";

export type LootRateRow = components["schemas"]["LootRate"];
export type LootRatePage = components["schemas"]["LootRatePage"];
export type OsrsNpcPage = components["schemas"]["OsrsNpcPage"];
export type OsrsSpritePage = components["schemas"]["OsrsSpritePage"];

/** The OSRSClans data that api-backend proxies and caches under /reference. */
export const osrsclansApi = {
  lootRatesFor: (itemName: string) =>
    apiFetch<LootRatePage>(`/reference/loot-rates?${new URLSearchParams({ q: itemName, limit: "100" })}`),
  searchNpcs: (q: string) => apiFetch<OsrsNpcPage>(`/reference/osrs/npcs?${new URLSearchParams({ q, limit: "20" })}`),
  searchSprites: (q: string) =>
    apiFetch<OsrsSpritePage>(`/reference/osrs/sprites?${new URLSearchParams({ q, limit: "20" })}`),
};
