import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { slugify } from "@/lib/utils";

export interface TocHeading {
  level: 1 | 2 | 3 | 4;
  text: string;
  id: string;
}

function parseTocMarkerAttrs(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of raw.split(/,(?=(indent|title|hidden)=)/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    result[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return result;
}

function parseTocOverride(body: string): TocHeading[] | null {
  const match = body.match(/^```toc\n([\s\S]*?)^```[ \t]*$/m);
  if (!match) return null;
  return (match[1] ?? "")
    .split("\n")
    .flatMap((line) => {
      if (!line.trim()) return [];
      const indent = line.match(/^(\s*)/)?.[1]?.length ?? 0;
      const level = (Math.min(Math.floor(indent / 2), 2) + 2) as 2 | 3 | 4;
      const [rawText, rawId] = line.trim().split("|").map((s) => s.trim());
      const text = rawText ?? "";
      const id = rawId ?? slugify(text);
      if (!text || !id) return [];
      return [{ level, text, id }];
    });
}

function stripInlineMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

export function extractHeadings(body: string): TocHeading[] {
  const override = parseTocOverride(body);
  if (override) return override;

  return body
    .split("\n")
    .flatMap((line) => {
      const tocMatch = line.match(/\[toc\]\{([^}]+)\}/);
      if (tocMatch) {
        const attrs = parseTocMarkerAttrs(tocMatch[1] ?? "");
        if (attrs.hidden === "true") return [];
        const text = (attrs.title ?? "").trim();
        const indent = Math.max(1, Math.min(3, parseInt(attrs.indent ?? "1", 10)));
        const level = (indent + 1) as 2 | 3 | 4;
        const id = slugify(text);
        if (!text || !id) return [];
        return [{ level, text, id }];
      }
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (!match) return [];
      const level = match[1].length as 1 | 2 | 3 | 4;
      const text = stripInlineMarkdown(match[2] ?? "");
      const id = slugify(text);
      if (!id) return [];
      return [{ level, text, id }];
    });
}

const indentClass: Record<number, string> = { 1: "", 2: "", 3: "pl-3", 4: "pl-6" };

function scrollTo(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

interface TocNavProps {
  headings: TocHeading[];
  activeId?: string;
}

function TocNav({ headings, activeId = "" }: TocNavProps): React.ReactElement {
  return (
    <ul className="space-y-1.5">
      {headings.map(({ id, text, level }) => (
        <li key={id} className={indentClass[level]}>
          <button
            type="button"
            onClick={() => scrollTo(id)}
            className={[
              "text-left text-xs leading-snug w-full transition-colors hover:text-foreground",
              activeId === id ? "text-primary font-semibold" : "text-muted-foreground",
            ].join(" ")}
          >
            {text}
          </button>
        </li>
      ))}
    </ul>
  );
}

interface TableOfContentsProps {
  headings: TocHeading[];
}

/** Desktop sticky right-column TOC with active heading tracking. */
export function TableOfContents({ headings }: TableOfContentsProps): React.ReactElement {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const markdownBody = document.querySelector<HTMLElement>(".markdown-body");
    let scrollTarget: Element | Window = window;
    if (markdownBody) {
      let node: HTMLElement | null = markdownBody.parentElement;
      while (node && node !== document.body) {
        const { overflowY } = getComputedStyle(node);
        if (overflowY === "auto" || overflowY === "scroll") { scrollTarget = node; break; }
        node = node.parentElement;
      }
    }

    function update() {
      const body = document.querySelector<HTMLElement>(".markdown-body");
      if (!body) return;
      const els = Array.from(
        body.querySelectorAll<HTMLElement>("h1,h2,h3,h4"),
      ).filter((el) => !!el.id);
      if (els.length === 0) return;

      const scrollEl = scrollTarget instanceof Window ? document.documentElement : scrollTarget as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const atBottom = scrollHeight - scrollTop - clientHeight < 20;
      if (atBottom && scrollTop > 20) {
        setActiveId(els[els.length - 1]!.id);
        return;
      }

      const threshold = 100;
      let active = "";
      for (const el of els) {
        if (el.getBoundingClientRect().top <= threshold) active = el.id;
      }
      setActiveId(active);
    }

    scrollTarget.addEventListener("scroll", update as EventListener, { passive: true });
    update();
    return () => scrollTarget.removeEventListener("scroll", update as EventListener);
  }, [headings]);

  return (
    <nav className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">
        On this page
      </p>
      <TocNav headings={headings} activeId={activeId} />
    </nav>
  );
}

/** Mobile collapsible inline TOC shown above the content. */
export function MobileToc({ headings }: TableOfContentsProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wide"
      >
        On this page
        <ChevronDown
          className={[
            "h-3.5 w-3.5 transition-transform text-muted-foreground",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          <TocNav headings={headings} />
        </div>
      )}
    </div>
  );
}
