import { useQuery } from "@tanstack/react-query";
import { referenceApi } from "@/api/reference";
import { queryKeys } from "@/lib/queryKeys";
import type { EfficiencyKind, LootCategory } from "@/types/reference";

export function useLootSources(category: LootCategory) {
  return useQuery({
    queryKey: queryKeys.reference.sources(category),
    queryFn: () => referenceApi.listSources(category),
    staleTime: 300_000,
  });
}

export function useLootSource(slug: string | null) {
  return useQuery({
    queryKey: queryKeys.reference.source(slug ?? ""),
    queryFn: () => referenceApi.getSource(slug as string),
    enabled: Boolean(slug),
    staleTime: 300_000,
  });
}

export function useEfficiencyRates(kind: EfficiencyKind) {
  return useQuery({
    queryKey: queryKeys.reference.rates(kind),
    queryFn: () => referenceApi.listRates(kind),
    staleTime: 300_000,
  });
}
