import { apiFetch, ApiRequestError } from "@/api/client";
import { API_URL } from "@/context/AuthContext";
import type { OsrsItem, OsrsSprite, OsrsSpriteCategory, OsrsSpritePage } from "@/types/osrsAssets";

/** Foundry's image route: it fetches each OSRSClans image once and serves its own copy after. */
const OSRS_IMAGES = `${API_URL}/reference/osrs/images`;

/** OSRSClans item image scales: 1x is 36 x 32, max is 512 x 455. */
export const ITEM_SCALES = [
  { scale: "1", label: "36 x 32" },
  { scale: "2", label: "72 x 64" },
  { scale: "4", label: "144 x 128" },
  { scale: "8", label: "288 x 256" },
  { scale: "max", label: "512 x 455" },
] as const;

export type ItemScale = (typeof ITEM_SCALES)[number]["scale"];

/** OSRSClans sprite image scales; max fits the sprite to 512 px. */
export const SPRITE_SCALES = ["1", "2", "4", "8", "16", "max"] as const;

export type SpriteScale = (typeof SPRITE_SCALES)[number];

/** The image of an item, at its largest size unless a scale is given. */
export function itemImageUrl(itemId: number, scale?: ItemScale): string {
  const query = scale && scale !== "max" ? `?scale=${scale}` : "";
  return `${OSRS_IMAGES}/items/${itemId}.webp${query}`;
}

/** The image of one sprite frame. */
export function spriteImageUrl(spriteId: number, frame: number, scale: SpriteScale = "1"): string {
  const params = new URLSearchParams({ frame: String(frame) });
  if (scale !== "1") params.set("scale", scale);
  return `${OSRS_IMAGES}/sprites/${spriteId}.webp?${params}`;
}

async function orEmpty<T>(lookup: Promise<T>, empty: T): Promise<T> {
  try {
    return await lookup;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return empty;
    throw err;
  }
}

/** The OSRS items and sprites api-backend reads from OSRSClans. */
export const osrsAssetsApi = {
  listItems: (limit: number, offset: number, search?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (search && search.length >= 2) params.set("search", search);
    return apiFetch<OsrsItem[]>(`/reference/osrs/items?${params}`);
  },

  getItem: (itemId: number): Promise<OsrsItem | null> =>
    orEmpty<OsrsItem | null>(apiFetch<OsrsItem>(`/reference/osrs/items/${itemId}`), null),

  getItemVariants: (itemId: number): Promise<OsrsItem[]> =>
    orEmpty(apiFetch<OsrsItem[]>(`/reference/osrs/items/${itemId}/variants`), []),

  listSprites: (limit: number, offset: number, options: { category?: string; search?: string } = {}) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (options.category) params.set("category", options.category);
    if (options.search && options.search.length >= 2) params.set("search", options.search);
    return apiFetch<OsrsSpritePage>(`/reference/osrs/sprite-frames?${params}`);
  },

  listSpriteCategories: () => apiFetch<OsrsSpriteCategory[]>("/reference/osrs/sprites/categories"),

  getSprite: (spriteId: number): Promise<OsrsSprite[]> =>
    orEmpty(apiFetch<OsrsSprite[]>(`/reference/osrs/sprite-frames/${spriteId}`), []),
};

/** Fetch an OSRS image from Foundry's image route and save it under `filename`. */
export async function downloadImage(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new ApiRequestError(res.status, "IMAGE_FAILED", "The image did not load");
  const blobUrl = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
}
