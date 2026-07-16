export interface OsrsSprite {
  sprite_id: number;
  frame_index: number;
  width: number;
  height: number;
  png_url: string;
  webp_url: string;
  name: string | null;
  category: string | null;
}

export interface OsrsSpriteCategory {
  category: string;
  count: number;
}

export interface OsrsItem {
  item_id: number;
  name: string;
  examine: string;
  stackable: boolean;
  value: number;
  members: boolean;
  tradeable: boolean;
  noted_id: number | null;
  noted_template: number | null;
  placeholder_id: number | null;
  placeholder_template: number | null;
  team_id: number | null;
  weight: number | null;
  icon_url: string | null;
  variant_count: number;
}

export interface OsrsCacheMeta {
  cache_build_id: number;
  openrs2_cache_id: number;
  game_build_major: number;
  game_build_minor: number | null;
  item_count: number;
  npc_count: number;
  object_count: number;
  sprite_count: number;
}
