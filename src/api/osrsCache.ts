import { API_URL } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/api/client";
import type {
  OsrsCacheMeta,
  OsrsItem,
  OsrsSprite,
  OsrsSpriteCategory,
} from "@/types/osrsCache";

export const ITEM_RENDER_SIZES = [32, 64, 128, 256, 512, 1024, 2048, 4096] as const;

export type ItemRenderSize = (typeof ITEM_RENDER_SIZES)[number];

export const SPRITE_RENDER_SCALES = Array.from({ length: 32 }, (_, i) => i + 1);

export type SpriteRenderScale = number;

export const osrsCacheApi = {
  meta: () => apiFetch<OsrsCacheMeta>("/osrs-cache/meta"),

  renderItemIcon: async (itemId: number, size: ItemRenderSize): Promise<Blob> => {
    const res = await fetch(
      `${API_URL}/osrs-cache/item-icons/${itemId}/render?size=${size}`,
    );
    if (!res.ok) {
      throw new ApiRequestError(res.status, "RENDER_FAILED", "Item render failed");
    }
    return res.blob();
  },

  listItems: (limit: number, offset: number, search?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (search) params.set("search", search);
    return apiFetch<OsrsItem[]>(`/osrs-cache/items?${params}`);
  },

  getItem: async (itemId: number): Promise<OsrsItem | null> => {
    try {
      return await apiFetch<OsrsItem>(`/osrs-cache/items/${itemId}`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) return null;
      throw err;
    }
  },

  getItemVariants: async (itemId: number): Promise<OsrsItem[]> => {
    try {
      return await apiFetch<OsrsItem[]>(`/osrs-cache/items/${itemId}/variants`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) return [];
      throw err;
    }
  },

  listSprites: (
    limit: number,
    offset: number,
    options: { category?: string; search?: string } = {},
  ) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (options.category) params.set("category", options.category);
    if (options.search) params.set("search", options.search);
    return apiFetch<OsrsSprite[]>(`/osrs-cache/sprites?${params}`);
  },

  listSpriteCategories: () =>
    apiFetch<OsrsSpriteCategory[]>("/osrs-cache/sprites/categories"),

  getSprite: async (spriteId: number): Promise<OsrsSprite[]> => {
    try {
      return await apiFetch<OsrsSprite[]>(`/osrs-cache/sprites/${spriteId}`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) return [];
      throw err;
    }
  },

  renderSprite: async (
    spriteId: number,
    frameIndex: number,
    scale: SpriteRenderScale,
  ): Promise<Blob> => {
    const res = await fetch(
      `${API_URL}/osrs-cache/sprites/${spriteId}/${frameIndex}?format=webp&scale=${scale}`,
    );
    if (!res.ok) {
      throw new ApiRequestError(res.status, "RENDER_FAILED", "Sprite render failed");
    }
    return res.blob();
  },
};
