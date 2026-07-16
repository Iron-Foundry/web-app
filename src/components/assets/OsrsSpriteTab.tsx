import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/context/AuthContext";
import { osrsCacheApi } from "@/api/osrsCache";
import { Input } from "@/components/ui/input";
import { findScrollParent } from "@/lib/scroll";
import type { OsrsSprite } from "@/types/osrsCache";
import { SpriteCategoryPicker } from "@/components/assets/SpriteCategoryPicker";
import { SpriteGrid } from "@/components/assets/SpriteGrid";

const PAGE_SIZE = 60;

export function OsrsSpriteTab(): React.JSX.Element {
  const [sprites, setSprites] = useState<OsrsSprite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [scrollElement, setScrollElement] = useState<Element | null>(null);

  const offsetRef = useRef(0);
  const bufferRef = useRef<OsrsSprite[] | null>(null);
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
      .listSprites(PAGE_SIZE, offsetRef.current, { category: category ?? undefined, search: nameSearch })
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
  }, [category, nameSearch]);

  const drain = useCallback(() => {
    if (!intersectingRef.current) return;
    if (!bufferRef.current) {
      ensureBuffer();
      return;
    }
    const batch = bufferRef.current;
    bufferRef.current = null;
    offsetRef.current += batch.length;
    setSprites((prev) => [...prev, ...batch]);
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
        .getSprite(Number(trimmedFilter))
        .then((data) => {
          if (generation === generationRef.current) setSprites(data);
        })
        .catch(() => {
          if (generation === generationRef.current) setSprites([]);
        })
        .finally(() => {
          if (generation === generationRef.current) setLoading(false);
        });
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    osrsCacheApi
      .listSprites(PAGE_SIZE, 0, { category: category ?? undefined, search: nameSearch })
      .then((data) => {
        if (generation !== generationRef.current) return;
        setSprites(data);
        offsetRef.current = data.length;
        hasMoreRef.current = data.length === PAGE_SIZE;
      })
      .catch(() => {
        if (generation === generationRef.current) setSprites([]);
      })
      .finally(() => {
        if (generation !== generationRef.current) return;
        fetchingRef.current = false;
        setLoading(false);
        drainRef.current();
      });
  }, [filterIsId, trimmedFilter, category, nameSearch, paginated]);

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
        if (intersectingRef.current) drain();
      },
      { root: findScrollParent(node), rootMargin: "600px" },
    );
    observer.observe(node);
    return () => {
      intersectingRef.current = false;
      observer.disconnect();
    };
  }, [paginated, drain]);

  const copyUrl = useCallback(async (sprite: OsrsSprite) => {
    await navigator.clipboard.writeText(`${API_URL}/osrs-cache${sprite.png_url}`);
    setCopied(sprite.sprite_id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const downloadSprite = useCallback(async (sprite: OsrsSprite) => {
    const res = await fetch(`${API_URL}/osrs-cache${sprite.png_url}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${sprite.name ?? `sprite-${sprite.sprite_id}`}.png`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  }, []);

  return (
    <div className="space-y-4" ref={rootRef}>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by ID or name…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 text-sm w-56"
        />
        <SpriteCategoryPicker value={category} onChange={setCategory} />
        <span className="text-xs text-muted-foreground ml-auto">{sprites.length} shown</span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
      ) : sprites.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {filterIsId ? `No sprite with ID ${trimmedFilter}.` : "No sprites found."}
        </p>
      ) : (
        <SpriteGrid
          sprites={sprites}
          scrollElement={scrollElement}
          copied={copied}
          onCopy={copyUrl}
          onDownload={downloadSprite}
        />
      )}

      {paginated && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
