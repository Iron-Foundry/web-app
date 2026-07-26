export type LootCategory = "boss" | "activity" | "clue" | "minigame";

export type RewardKind = "chest" | null;

export interface LootSource {
  slug: string;
  display_name: string;
  category: LootCategory;
  wiki_page: string;
  reward_kind: RewardKind;
  updated_at: string;
  drop_count: number;
}

export interface LootDrop {
  item_id: number | null;
  item_name: string;
  quantity_low: number;
  quantity_high: number;
  noted: boolean;
  rarity_num: number | null;
  rarity_denom: number | null;
  rarity_text: string | null;
  rolls: number;
  drop_group: string;
  ge_price: number | null;
}

export interface LootSourceDetail {
  slug: string;
  display_name: string;
  category: LootCategory;
  wiki_page: string;
  reward_kind: RewardKind;
  updated_at: string;
  drops: LootDrop[];
}

export type EfficiencyKind = "ehp" | "ehb";

export interface EfficiencyRate {
  metric: string;
  kind: EfficiencyKind;
  rate: number;
  payload: Record<string, unknown>;
  updated_at: string;
}
