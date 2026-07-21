import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/context/AuthContext";
import { osrsCacheApi } from "@/api/osrsCache";
import { assetsApi } from "@/api/assets";

export interface AssetResult {
  key: string;
  name: string;
  url: string;
}

const PAGE_SIZE = 60;

export function useAssetPickerResults(open: boolean, tab: string, query: string) {
  const [results, setResults] = useState<AssetResult[]>([]);
  const [loading, setLoading] = useState(false);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);
  const intersectingRef = useRef(false);
  const generationRef = useRef(0);

  const fetchPage = useCallback(
    async (offset: number): Promise<{ rows: AssetResult[]; rawLength: number; done: boolean }> => {
      const q = query.trim();
      if (tab === "items") {
        const items = await osrsCacheApi.listItems(PAGE_SIZE, offset, q || undefined);
        const rows = items
          .filter((i) => i.icon_url)
          .map((i) => ({
            key: `i${i.item_id}`,
            name: i.name,
            url: `${API_URL}/osrs-cache${i.icon_url}`,
          }));
        return { rows, rawLength: items.length, done: false };
      }
      if (tab === "sprites") {
        const sprites = await osrsCacheApi.listSprites(PAGE_SIZE, offset, { search: q || undefined });
        const rows = sprites.map((s) => ({
          key: `s${s.sprite_id}-${s.frame_index}`,
          name: s.name ?? `Sprite ${s.sprite_id}`,
          url: `${API_URL}/osrs-cache${s.png_url}`,
        }));
        return { rows, rawLength: sprites.length, done: false };
      }
      const assets = await assetsApi.list();
      const rows = assets
        .filter((a) => a.content_type.startsWith("image/"))
        .filter((a) => !q || a.original_name.toLowerCase().includes(q.toLowerCase()))
        .map((a) => ({ key: a.id, name: a.original_name, url: `${API_URL}${a.url}` }));
      return { rows, rawLength: rows.length, done: true };
    },
    [tab, query],
  );

  const loadMore = useCallback(() => {
    if (fetchingRef.current || !hasMoreRef.current) return;
    fetchingRef.current = true;
    const generation = generationRef.current;
    fetchPage(offsetRef.current)
      .then(({ rows, rawLength, done }) => {
        if (generation !== generationRef.current) return;
        offsetRef.current += rawLength;
        if (done || rawLength < PAGE_SIZE) hasMoreRef.current = false;
        setResults((prev) => [...prev, ...rows]);
      })
      .catch(() => {
        if (generation === generationRef.current) hasMoreRef.current = false;
      })
      .finally(() => {
        if (generation !== generationRef.current) return;
        fetchingRef.current = false;
        if (intersectingRef.current) loadMore();
      });
  }, [fetchPage]);

  useEffect(() => {
    if (!open) return;
    const generation = ++generationRef.current;
    offsetRef.current = 0;
    hasMoreRef.current = true;
    fetchingRef.current = true;
    setLoading(true);
    if (gridRef.current) gridRef.current.scrollTop = 0;
    fetchPage(0)
      .then(({ rows, rawLength, done }) => {
        if (generation !== generationRef.current) return;
        setResults(rows);
        offsetRef.current = rawLength;
        hasMoreRef.current = !done && rawLength === PAGE_SIZE;
      })
      .catch(() => {
        if (generation === generationRef.current) setResults([]);
      })
      .finally(() => {
        if (generation !== generationRef.current) return;
        fetchingRef.current = false;
        setLoading(false);
        if (intersectingRef.current) loadMore();
      });
  }, [open, tab, query, fetchPage, loadMore]);

  useEffect(() => {
    if (!open) return;
    const node = sentinelRef.current;
    const rootEl = gridRef.current;
    if (!node || !rootEl) return;
    const observer = new IntersectionObserver(
      (entries) => {
        intersectingRef.current = entries[0]?.isIntersecting ?? false;
        if (intersectingRef.current) loadMore();
      },
      { root: rootEl, rootMargin: "200px" },
    );
    observer.observe(node);
    return () => {
      intersectingRef.current = false;
      observer.disconnect();
    };
  }, [open, loadMore]);

  return { results, loading, gridRef, sentinelRef };
}
