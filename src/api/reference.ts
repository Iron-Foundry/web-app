import { apiFetch } from "@/api/client";
import type { EfficiencyKind, EfficiencyRate } from "@/types/reference";

export const referenceApi = {
  listRates: (kind?: EfficiencyKind) =>
    apiFetch<EfficiencyRate[]>(`/reference/rates${kind ? `?kind=${kind}` : ""}`),
};
