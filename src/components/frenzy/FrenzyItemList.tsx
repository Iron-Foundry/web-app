import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// Nine rows of 2.25rem (h-6 image plus py-1.5) with 0.25rem gaps: 22.25rem, max-h-89.
const VISIBLE_ROWS = 9;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A card's item rows: up to nine, then an inner scroll with a fade and a chevron until the end. */
export function FrenzyItemList({ count, children }: { count: number; children: React.ReactNode }): React.ReactElement {
  const listRef = useRef<HTMLUListElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  const scrolls = count > VISIBLE_ROWS;

  function trackEnd(): void {
    const el = listRef.current;
    if (el) setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
  }

  function scrollDown(): void {
    const el = listRef.current;
    el?.scrollBy({ top: el.clientHeight * 0.8, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  return (
    <div className="relative">
      <ul ref={listRef} onScroll={trackEnd} className={scrolls ? "max-h-89 space-y-1 overflow-y-auto pr-1" : "space-y-1"}>
        {children}
      </ul>
      {scrolls && !atEnd && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-linear-to-t from-card to-transparent">
          <button
            type="button"
            onClick={scrollDown}
            aria-label="Show more items"
            className="pointer-events-auto rounded-md p-0.5 text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
