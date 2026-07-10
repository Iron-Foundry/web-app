const MAX_CACHE_SIZE = 2048;

const cache = new Map<string, HTMLImageElement>();
const order: string[] = [];

/**
 * Returns a cached HTMLImageElement for the given URL, loading it if necessary.
 * Evicts the oldest entry when the cache exceeds MAX_CACHE_SIZE.
 */
export function getTileImage(url: string): HTMLImageElement {
  const cached = cache.get(url);
  if (cached) return cached;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.src = url;

  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = order.shift();
    if (oldest) cache.delete(oldest);
  }

  cache.set(url, img);
  order.push(url);
  return img;
}

export function clearTileCache(): void {
  cache.clear();
  order.length = 0;
}
