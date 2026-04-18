/**
 * Simple in-memory TTL cache for API responses.
 * Keyed by arbitrary strings; values expire after `ttl` ms.
 * Mutations should call `invalidate(prefix)` to bust stale entries.
 */

interface Entry {
  data: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  store.set(key, { data, expiresAt: Date.now() + ttl });
}

/** Delete all entries whose key starts with `prefix`. */
export function cacheInvalidate(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/**
 * Fetch `url`, returning a cached response if one exists and hasn't expired.
 * Throws on non-ok responses (consistent with callers that check `r.ok`).
 */
export async function fetchCached<T>(
  url: string,
  options?: RequestInit & { cacheKey?: string; ttl?: number },
): Promise<T> {
  const key = options?.cacheKey ?? url;
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;

  const res = await fetch(url, options);
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, response: res });
  const data = (await res.json()) as T;
  cacheSet(key, data, options?.ttl);
  return data;
}
