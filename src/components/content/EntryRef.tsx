import { useRef, useState, useEffect, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { contentApi } from "@/api/content";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { EntryDetail } from "@/types/content";

const MarkdownRenderer = lazy(() =>
  import("./MarkdownRenderer").then((m) => ({ default: m.MarkdownRenderer }))
);

const ROUTE_BASE: Record<string, string> = {
  resource: "/resources",
  plugin: "/plugins",
  staff_resource: "/staff-portal/resources",
};

const TYPE_LABEL: Record<string, string> = {
  resource: "Resource",
  plugin: "Plugin",
  staff_resource: "Staff Resource",
};

interface EntryRefProps {
  type: string;
  slug: string;
  section?: string;
  children: React.ReactNode;
}

export function EntryRef({ type, slug, section, children }: EntryRefProps) {
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const cachedEntryRef = useRef<EntryDetail | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});

  const routeBase = ROUTE_BASE[type] ?? "/resources";
  const href = `${routeBase}/${slug}${section ? `#${section}` : ""}`;

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  // Scroll preview to section once entry loads
  useEffect(() => {
    if (!open || !entry || !section || !scrollableRef.current) return;
    const el = scrollableRef.current.querySelector<HTMLElement>(`#${section}`);
    if (el) scrollableRef.current.scrollTop = el.offsetTop - 8;
  }, [open, entry, section]);

  function computeCardStyle(rect: DOMRect): React.CSSProperties {
    const cardWidth = 560;
    const cardMaxHeight = 520;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < cardMaxHeight && rect.top > spaceBelow;
    return {
      position: "fixed",
      left: Math.max(8, Math.min(rect.left, window.innerWidth - cardWidth - 16)),
      top: showAbove ? Math.max(8, rect.top - cardMaxHeight - 8) : rect.bottom + 8,
      width: cardWidth,
      zIndex: 9999,
    };
  }

  async function fetchAndOpen() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setCardStyle(computeCardStyle(rect));

    if (cachedEntryRef.current) {
      setEntry(cachedEntryRef.current);
      setOpen(true);
      return;
    }

    setLoading(true);
    setOpen(true);
    try {
      const data = await contentApi.getEntryBySlug(type, slug);
      cachedEntryRef.current = data;
      setEntry(data);
    } catch {
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function onTriggerEnter() {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
    if (open) return;
    hoverTimer.current = setTimeout(fetchAndOpen, 400);
  }

  function onTriggerLeave() {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    leaveTimer.current = setTimeout(() => setOpen(false), 150);
  }

  function onCardEnter() {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
  }

  function onCardLeave() {
    leaveTimer.current = setTimeout(() => setOpen(false), 150);
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    setOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (navigate as any)({ to: `${routeBase}/${slug}` });
    if (section) {
      setTimeout(() => {
        document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }

  return (
    <>
      <a
        ref={triggerRef}
        href={href}
        onClick={handleClick}
        onMouseEnter={onTriggerEnter}
        onMouseLeave={onTriggerLeave}
        className="text-primary underline decoration-dotted hover:no-underline cursor-pointer"
      >
        <span className="opacity-50 mr-0.5">§</span>{children}
      </a>

      {open && createPortal(
        <div
          style={cardStyle}
          onMouseEnter={onCardEnter}
          onMouseLeave={onCardLeave}
          className="rounded-lg border border-primary/30 bg-popover shadow-2xl ring-1 ring-primary/10 overflow-hidden flex flex-col"
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
              {TYPE_LABEL[type] ?? type}
            </Badge>
            <span className="text-sm font-medium truncate text-foreground">
              {loading ? <Skeleton className="h-4 w-32" /> : (entry?.title ?? slug)}
            </span>
          </div>

          <div ref={scrollableRef} className="overflow-y-auto" style={{ maxHeight: 420 }}>
            {loading ? (
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : entry ? (
              <div className="p-3 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h4]:text-xs [&_p]:text-xs [&_li]:text-xs">
                <Suspense fallback={
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                }>
                  <MarkdownRenderer body={entry.body} />
                </Suspense>
              </div>
            ) : null}
          </div>

          {!loading && entry && (
            <div className="border-t border-border px-3 py-1.5 shrink-0">
              <button
                onClick={handleClick}
                className="text-xs text-primary hover:underline"
              >
                Open full entry →
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
