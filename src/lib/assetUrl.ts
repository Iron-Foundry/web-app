import { API_URL } from "@/context/AuthContext";

/** Widths the api-backend will render a cached thumbnail for. */
export type ThumbnailWidth = 128 | 256 | 512;

const THUMBNAILABLE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);

export function assetUrl(url: string): string {
  return `${API_URL}${url}`;
}

/**
 * Downscaled variant of an uploaded asset, for grids and thumbnail strips.
 * Falls back to the original for types the backend cannot rasterise (SVG,
 * video), which it also does server-side - the width is only a hint.
 */
export function assetThumbnailUrl(
  url: string,
  contentType: string,
  width: ThumbnailWidth,
): string {
  if (!THUMBNAILABLE_TYPES.has(contentType)) return assetUrl(url);
  return `${assetUrl(url)}?w=${width}`;
}
