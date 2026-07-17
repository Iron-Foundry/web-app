import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/context/AuthContext";
import { osrsCacheApi } from "@/api/osrsCache";
import { Input } from "@/components/ui/input";
import { findScrollParent } from "@/lib/scroll";
import type { OsrsItem } from "@/types/osrsCache";
import { ItemIconGrid } from "@/components/assets/ItemIconGrid";

const PAGE_SIZE = 60;

export function OsrsItemIconTab(): React.JSX.Element {
  const [items, setItems] = useState<OsrsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [scrollElement, setScrollElement] = useState<Element | null>(null);

  const offsetRef = useRef(0);
  const bufferRef = useRef<OsrsItem[] | null>(null);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);
  const intersectingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const generationRef = useRef(0);

  const trimmedFilter = filter.trim();
  const filterIsId = trimmedFilter !== "" && /^\d+$/.test(trimmedFilter);
  const nameSearch = trimmedFilter !== "" && !filterIsId ? trimmedFilter : undefined;
  const paginated = !filterIsId;

  const drainRef = useRef<() => void>(() => {});

  const ensureBuffer = useCallback(() => {
    if (fetchingRef.current || !hasMoreRef.current || bufferRef.current) return;
    fetchingRef.current = true;
    const generation = generationRef.current;
    osrsCacheApi
      .listItems(PAGE_SIZE, offsetRef.current, nameSearch)
      .then((data) => {
        if (generation !== generationRef.current) return;
        bufferRef.current = data;
        if (data.length < PAGE_SIZE) hasMoreRef.current = false;
      })
      .catch(() => {
        if (generation === generationRef.current) hasMoreRef.current = false;
      })
      .finally(() => {
        if (generation !== generationRef.current) return;
        fetchingRef.current = false;
        drainRef.current();
      });
  }, [nameSearch]);

  const drain = useCallback(() => {
    if (!intersectingRef.current) return;
    if (!bufferRef.current) {
      ensureBuffer();
      return;
    }
    const batch = bufferRef.current;
    bufferRef.current = null;
    offsetRef.current += batch.length;
    setItems((prev) => [...prev, ...batch]);
    ensureBuffer();
  }, [ensureBuffer]);
  drainRef.current = drain;

  useEffect(() => {
    const generation = ++generationRef.current;
    offsetRef.current = 0;
    bufferRef.current = null;
    hasMoreRef.current = paginated;

    if (filterIsId) {
      fetchingRef.current = false;
      setLoading(true);
      osrsCacheApi
        .getItem(Number(trimmedFilter))
        .then((data) => {
          if (generation === generationRef.current) setItems(data ? [data] : []);
        })
        .catch(() => {
          if (generation === generationRef.current) setItems([]);
        })
        .finally(() => {
          if (generation === generationRef.current) setLoading(false);
        });
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    osrsCacheApi
      .listItems(PAGE_SIZE, 0, nameSearch)
      .then((data) => {
        if (generation !== generationRef.current) return;
        setItems(data);
        offsetRef.current = data.length;
        hasMoreRef.current = data.length === PAGE_SIZE;
      })
      .catch(() => {
        if (generation === generationRef.current) setItems([]);
      })
      .finally(() => {
        if (generation !== generationRef.current) return;
        fetchingRef.current = false;
        setLoading(false);
        drainRef.current();
      });
  }, [filterIsId, trimmedFilter, nameSearch, paginated]);

  useEffect(() => {
    setScrollElement(findScrollParent(rootRef.current));
  }, []);

  useEffect(() => {
    if (!paginated) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        intersectingRef.current = entries[0]?.isIntersecting ?? false;
        if (intersectingRef.current) drainRef.current();
      },
      { root: findScrollParent(node), rootMargin: "600px" },
    );
    observer.observe(node);
    return () => {
      intersectingRef.current = false;
      observer.disconnect();
    };
  }, [paginated]);

  const copyUrl = useCallback(async (item: OsrsItem) => {
    if (!item.icon_url) return;
    await navigator.clipboard.writeText(`${API_URL}/osrs-cache${item.icon_url}`);
    setCopied(item.item_id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const downloadIcon = useCallback(async (item: OsrsItem) => {
    if (!item.icon_url) return;
    const res = await fetch(`${API_URL}/osrs-cache${item.icon_url}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${item.name}.webp`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  }, []);

  const selectVariant = useCallback((item: OsrsItem) => setFilter(String(item.item_id)), []);

  return (
    <div className="space-y-4" ref={rootRef}>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by ID or name…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 text-sm w-56"
        />
        <span className="text-xs text-muted-foreground ml-auto">{items.length} shown</span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {filterIsId ? `No item with ID ${trimmedFilter}.` : "No items found."}
        </p>
      ) : (
        <ItemIconGrid
          items={items}
          scrollElement={scrollElement}
          copied={copied}
          onCopy={copyUrl}
          onDownload={downloadIcon}
          onSelectVariant={selectVariant}
        />
      )}

      {paginated && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
