/**
 * Decoded-tile cache. Tiles are fetched as blobs and decoded to `ImageBitmap`
 * off the main thread (`createImageBitmap`), so the draw loop uploads them with
 * no per-frame decode. Eviction is a true LRU bounded by decoded bytes, not by
 * entry count: a 256x256 RGBA bitmap is 256 KB, so an entry-count cap would let
 * decoded memory balloon into hundreds of MB. An `ImageBitmap` holds heap/GPU
 * memory until `.close()`, and in-flight loads are aborted on evict.
 */

const MAX_BYTES = 256 * 1024 * 1024;

type FetchPriority = "high" | "low" | "auto";

interface TileEntry {
  bitmap: ImageBitmap | null;
  bytes: number;
  controller: AbortController;
}

const cache = new Map<string, TileEntry>();
let totalBytes = 0;

function evictIfNeeded(): void {
  while (totalBytes > MAX_BYTES && cache.size > 0) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    const entry = cache.get(oldest);
    if (entry) {
      entry.controller.abort();
      if (entry.bitmap) {
        entry.bitmap.close();
        totalBytes -= entry.bytes;
      }
    }
    cache.delete(oldest);
  }
}

/**
 * Returns the decoded tile if ready, else `null` and kicks off an async load,
 * calling `onReady` once it lands. Repeated calls bump LRU recency.
 */
export function getTile(
  url: string,
  onReady?: () => void,
  priority: FetchPriority = "auto",
): ImageBitmap | null {
  const existing = cache.get(url);
  if (existing) {
    cache.delete(url);
    cache.set(url, existing);
    return existing.bitmap;
  }

  const controller = new AbortController();
  const entry: TileEntry = { bitmap: null, bytes: 0, controller };
  cache.set(url, entry);

  fetch(url, { signal: controller.signal, priority } as RequestInit)
    .then((r) => (r.ok ? r.blob() : null))
    .then((blob) => (blob ? createImageBitmap(blob) : null))
    .then((bitmap) => {
      if (!bitmap) return;
      if (!cache.has(url)) {
        bitmap.close();
        return;
      }
      entry.bitmap = bitmap;
      entry.bytes = bitmap.width * bitmap.height * 4;
      totalBytes += entry.bytes;
      evictIfNeeded();
      onReady?.();
    })
    .catch(() => undefined);

  return null;
}

/** Warms a tile without needing its result now (speculative preload). */
export function preloadTile(url: string, priority: FetchPriority = "low"): void {
  getTile(url, undefined, priority);
}

export function clearTileCache(): void {
  for (const entry of cache.values()) {
    entry.controller.abort();
    entry.bitmap?.close();
  }
  cache.clear();
  totalBytes = 0;
}
