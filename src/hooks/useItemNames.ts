import { useQuery } from "@tanstack/react-query";

interface ItemMappingEntry {
  id: number;
  name: string;
}

async function fetchItemNames(): Promise<Map<number, string>> {
  const res = await fetch("https://prices.runescape.wiki/api/v1/osrs/mapping");
  if (!res.ok) throw new Error(`Item mapping request failed: ${res.status}`);
  const entries = (await res.json()) as ItemMappingEntry[];
  const names = new Map<number, string>();
  for (const entry of entries) names.set(entry.id, entry.name);
  return names;
}

/**
 * Loads the OSRS item id to name mapping once and caches it for the session.
 * Shared by every item tile so names can be shown on hover.
 */
export function useItemNames() {
  return useQuery({
    queryKey: ["osrs-item-names"],
    queryFn: fetchItemNames,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
