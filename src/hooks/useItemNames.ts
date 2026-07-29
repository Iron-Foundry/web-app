import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

async function fetchItemNames(): Promise<Map<number, string>> {
  const mapping = await apiFetch<Record<string, string>>(
    "/osrs-cache/items/names",
  );
  const names = new Map<number, string>();
  for (const [id, name] of Object.entries(mapping)) names.set(Number(id), name);
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
