import { useQuery } from "@tanstack/react-query";
import { referenceApi } from "@/api/reference";
import { queryKeys } from "@/lib/queryKeys";
import type { EfficiencyKind } from "@/types/reference";

export function useEfficiencyRates(kind: EfficiencyKind) {
  return useQuery({
    queryKey: queryKeys.reference.rates(kind),
    queryFn: () => referenceApi.listRates(kind),
    staleTime: 300_000,
  });
}
