import { apiFetch } from "./client";
import type {
  EfficiencyKind,
  EfficiencyRate,
  LootCategory,
  LootSource,
  LootSourceDetail,
} from "@/types/reference";

export const referenceApi = {
  listSources: (category?: LootCategory) =>
    apiFetch<LootSource[]>(
      `/reference/loot/sources${category ? `?category=${category}` : ""}`,
    ),

  getSource: (slug: string) =>
    apiFetch<LootSourceDetail>(`/reference/loot/sources/${encodeURIComponent(slug)}`),

  listRates: (kind?: EfficiencyKind) =>
    apiFetch<EfficiencyRate[]>(`/reference/rates${kind ? `?kind=${kind}` : ""}`),
};
