import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { osrsclansApi, type LootRateRow, type OsrsNpcPage, type OsrsSpritePage } from "@/api/osrsclans";
import { queryKeys } from "@/lib/queryKeys";

const STALE_1H = 1000 * 60 * 60;

/** The loot rate rows of one item, from every source that drops it. */
export function useItemLootRates(itemName: string, enabled: boolean): UseQueryResult<LootRateRow[]> {
  return useQuery({
    queryKey: queryKeys.reference.itemLootRates(itemName),
    queryFn: () => osrsclansApi.lootRatesFor(itemName),
    select: (page) => page.items.filter((row) => row.item_name === itemName),
    staleTime: STALE_1H,
    enabled: enabled && itemName.length >= 2,
  });
}

/** A fetcher for the drops of one collection log page, cached for an hour per page name. */
export function useCollectionLogFetch(): (name: string) => Promise<LootRateRow[]> {
  const qc = useQueryClient();
  return async (name) => {
    const page = await qc.fetchQuery({
      queryKey: queryKeys.reference.collectionLog(name),
      queryFn: () => osrsclansApi.collectionLog(name),
      staleTime: STALE_1H,
    });
    return page.items;
  };
}

export function useNpcSearch(q: string): UseQueryResult<OsrsNpcPage> {
  return useQuery({
    queryKey: queryKeys.reference.npcSearch(q),
    queryFn: () => osrsclansApi.searchNpcs(q),
    staleTime: STALE_1H,
    enabled: q.length >= 2,
  });
}

export function useSpriteSearch(q: string): UseQueryResult<OsrsSpritePage> {
  return useQuery({
    queryKey: queryKeys.reference.spriteSearch(q),
    queryFn: () => osrsclansApi.searchSprites(q),
    staleTime: STALE_1H,
    enabled: q.length >= 2,
  });
}
