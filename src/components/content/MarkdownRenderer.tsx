import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import type { CSSProperties } from "react";
import { slugify, headingText } from "@/lib/utils";
import { EntryRef } from "./EntryRef";
import { WikiHoverLink } from "./WikiHoverLink";
import { wikiTitleFromUrl, wikiUrlFromTitle } from "@/hooks/useWikiSummary";
import { TileMarkerEmbedGroup } from "@/components/runelite/TileMarkerEmbedGroup";
import { BossHealthEmbed } from "@/components/runelite/BossHealthEmbed";
import { BankTagEmbed } from "@/components/runelite/BankTagEmbed";
import { InventorySetupEmbed } from "@/components/runelite/InventorySetupEmbed";
import { decodeGlow, glowToFilter } from "@/components/runelite/glow";

function glowFilterFromSpec(spec: string): string {
  const glow = decodeGlow(spec);
  return glow ? glowToFilter(glow) : "";
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0] ?? null;
    if (u.hostname === "youtube.com" || u.hostname === "www.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return m[1] ?? null;
    }
  } catch {}
  return null;
}

const tocAnchorStyle: CSSProperties = {
  height: 0,
  overflow: "hidden",
  margin: 0,
  padding: 0,
  scrollMarginTop: "80px",
};

const components: Components = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h1: ({ children, ...rest }: any) => {
    if (rest["data-toc-anchor"]) return <h1 id={rest.id as string} style={tocAnchorStyle} />;
    const id = slugify(headingText(children)) || undefined;
    return <h1 id={id} className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h2: ({ children, ...rest }: any) => {
    if (rest["data-toc-anchor"]) return <h2 id={rest.id as string} style={tocAnchorStyle} />;
    const id = slugify(headingText(children)) || undefined;
    return <h2 id={id} className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h3: ({ children, ...rest }: any) => {
    if (rest["data-toc-anchor"]) return <h3 id={rest.id as string} style={tocAnchorStyle} />;
    const id = slugify(headingText(children)) || undefined;
    return <h3 id={id} className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h3>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h4: ({ children, ...rest }: any) => {
    if (rest["data-toc-anchor"]) return <h4 id={rest.id as string} style={tocAnchorStyle} />;
    const id = slugify(headingText(children)) || undefined;
    return <h4 id={id} className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h4>;
  },
  p: ({ children }) => <p className="mb-4 text-sm leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 text-sm space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 text-sm space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-sm">{children}</li>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code: ({ inline, children, ...props }: any) =>
    inline ? (
      <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded" {...props}>{children}</code>
    ) : (
      <code className="font-mono text-xs" {...props}>{children}</code>
    ),
  pre: ({ children }) => <pre className="bg-muted rounded-md p-4 overflow-x-auto mb-4 text-xs">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground mb-4">{children}</blockquote>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  a: ({ href, children, ...props }: any) => {
    if (props["data-entry-ref"] === "true") {
      return (
        <EntryRef type={props["data-type"]} slug={props["data-slug"]} section={props["data-section"]}>
          {children}
        </EntryRef>
      );
    }
    if (href) {
      const wikiTitle = wikiTitleFromUrl(href);
      if (wikiTitle) {
        return (
          <WikiHoverLink href={href} title={wikiTitle}>
            {children}
          </WikiHoverLink>
        );
      }
      const ytId = extractYouTubeId(href);
      if (ytId) {
        return (
          <div className="relative my-4" style={{ paddingTop: "56.25%" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}`}
              className="absolute inset-0 w-full h-full rounded-md"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );
      }
    }
    return <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noreferrer">{children}</a>;
  },
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="border-border my-6" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="text-left p-2 border-b border-border font-semibold bg-muted/50">{children}</th>,
  td: ({ children }) => <td className="p-2 border-b border-border">{children}</td>,
  div: ({ style, className, children, ...props }) => {
    const bossHealthId = (props as Record<string, unknown>)["data-bosshealth-id"];
    if (typeof bossHealthId === "string" && bossHealthId) {
      return <BossHealthEmbed configId={bossHealthId} />;
    }
    const glowAttr = (props as Record<string, unknown>)["data-glow"];
    const glow = typeof glowAttr === "string" && glowAttr ? glowAttr : undefined;
    const bankTagId = (props as Record<string, unknown>)["data-banktag-id"];
    if (typeof bankTagId === "string" && bankTagId) {
      return <BankTagEmbed configId={bankTagId} glow={glow} />;
    }
    const invSetupId = (props as Record<string, unknown>)["data-invsetup-id"];
    if (typeof invSetupId === "string" && invSetupId) {
      return <InventorySetupEmbed configId={invSetupId} glow={glow} />;
    }
    const tilemarkerGroup = (props as Record<string, unknown>)["data-tilemarker-group"];
    if (typeof tilemarkerGroup === "string" && tilemarkerGroup) {
      const align = (props as Record<string, unknown>)["data-tilemarker-align"];
      return (
        <TileMarkerEmbedGroup
          ids={tilemarkerGroup.split(",")}
          align={typeof align === "string" ? align : "left"}
        />
      );
    }
    const s = style as CSSProperties | undefined;
    const border = s?.borderLeft as string | undefined;
    if (border?.includes("#4ade80") || className?.includes("callout-tip"))
      return <div className="callout-tip">{children}</div>;
    if (border?.includes("#f87171") || className?.includes("callout-warning"))
      return <div className="callout-warning">{children}</div>;
    if (border?.includes("#60a5fa") || className?.includes("callout-info"))
      return <div className="callout-info">{children}</div>;
    return <div style={s} className={className} {...props}>{children}</div>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  img: ({ src, alt, width, ...props }: any) => {
    const style = width ? { width: typeof width === "number" ? `${width}px` : width } : undefined;
    if (props["data-inline"] === "true" || props["data-inline"] === true) {
      return (
        <img
          src={src}
          alt={alt ?? ""}
          style={style}
          className="inline align-middle mx-0.5 my-0 max-w-full"
        />
      );
    }
    return <img src={src} alt={alt ?? ""} style={style} className="max-w-full rounded-md my-2" />;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  video: ({ src, width, ...props }: any) => {
    const style = width ? { width: typeof width === "number" ? `${width}px` : width } : undefined;
    return <video src={src} controls style={style} className="max-w-full rounded-md my-2" {...props} />;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kbd: ({ children }: any) => (
    <kbd className="font-mono text-xs border border-border rounded px-1.5 py-0.5 bg-muted shadow-sm">
      {children}
    </kbd>
  ),
};

function parseTocMarkerAttrs(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of raw.split(/,(?=(indent|title|hidden)=)/)) {
    const eq = part.indexOf("=");
    if (eq !== -1) result[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return result;
}

interface MdNode {
  type: string;
  value?: string;
  lang?: string;
  url?: string;
  children?: MdNode[];
}

const SHORTCODE = new RegExp(
  [
    "(?:\\[\\[tilemarker:[a-zA-Z0-9-]+(?:\\|(?:left|center|right))?\\]\\]\\s*)+",
    "\\[\\[bosshealth:[a-zA-Z0-9-]+\\]\\]",
    "\\[\\[banktag:[a-zA-Z0-9-]+(?:\\|glow=[\\d.,]+)?\\]\\]",
    "\\[\\[invsetup:[a-zA-Z0-9-]+(?:\\|glow=[\\d.,]+)?\\]\\]",
    "\\[\\[wiki:[^\\]|#]+(?:\\|[^\\]]+)?\\]\\]",
    "\\[\\[\\w+:[a-z0-9-]+(?:#[a-z0-9-]+)?(?:\\|[^\\]]+)?\\]\\]",
    "\\[toc\\]\\{[^}]+\\}",
  ].join("|"),
  "g",
);

function htmlNode(value: string): MdNode {
  return { type: "html", value };
}

function shortcodeToNode(source: string): MdNode {
  let m: RegExpMatchArray | null;
  if (source.startsWith("[[tilemarker:")) {
    const items = [
      ...source.matchAll(/\[\[tilemarker:([a-zA-Z0-9-]+)(?:\|(left|center|right))?\]\]/g),
    ];
    const ids = items.map((i) => i[1]).join(",");
    const align = items.find((i) => i[2])?.[2] ?? "left";
    return htmlNode(`<div data-tilemarker-group="${ids}" data-tilemarker-align="${align}"></div>`);
  }
  if ((m = source.match(/^\[\[bosshealth:([a-zA-Z0-9-]+)\]\]$/))) {
    return htmlNode(`<div data-bosshealth-id="${m[1]}"></div>`);
  }
  if ((m = source.match(/^\[\[banktag:([a-zA-Z0-9-]+)(?:\|glow=([\d.,]+))?\]\]$/))) {
    const glow = m[2] ? ` data-glow="${glowFilterFromSpec(m[2])}"` : "";
    return htmlNode(`<div data-banktag-id="${m[1]}"${glow}></div>`);
  }
  if ((m = source.match(/^\[\[invsetup:([a-zA-Z0-9-]+)(?:\|glow=([\d.,]+))?\]\]$/))) {
    const glow = m[2] ? ` data-glow="${glowFilterFromSpec(m[2])}"` : "";
    return htmlNode(`<div data-invsetup-id="${m[1]}"${glow}></div>`);
  }
  if ((m = source.match(/^\[\[wiki:([^\]|#]+)(?:\|([^\]]+))?\]\]$/))) {
    return {
      type: "link",
      url: wikiUrlFromTitle(m[1]!),
      children: [{ type: "text", value: (m[2] ?? m[1]!).trim() }],
    };
  }
  if ((m = source.match(/^\[\[(\w+):([a-z0-9-]+)(?:#([a-z0-9-]+))?(?:\|([^\]]+))?\]\]$/))) {
    const sec = m[3] ? ` data-section="${m[3]}"` : "";
    return htmlNode(
      `<a data-entry-ref="true" data-type="${m[1]}" data-slug="${m[2]}"${sec}>${m[4] || m[2]}</a>`,
    );
  }
  if ((m = source.match(/^\[toc\]\{([^}]+)\}$/))) {
    const attrs = parseTocMarkerAttrs(m[1]!);
    const title = (attrs.title ?? "").trim();
    const id = slugify(title);
    if (!id) return { type: "text", value: "" };
    const indent = Math.max(1, Math.min(3, parseInt(attrs.indent ?? "1", 10)));
    return htmlNode(`<h${indent + 1} id="${id}" data-toc-anchor="true">${title}</h${indent + 1}>`);
  }
  return { type: "text", value: source };
}

function splitShortcodes(value: string): MdNode[] | null {
  const nodes: MdNode[] = [];
  let last = 0;
  for (const match of value.matchAll(SHORTCODE)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push({ type: "text", value: value.slice(last, start) });
    nodes.push(shortcodeToNode(match[0]));
    last = start + match[0].length;
  }
  if (nodes.length === 0) return null;
  if (last < value.length) nodes.push({ type: "text", value: value.slice(last) });
  return nodes;
}

function transformShortcodeNodes(node: MdNode): void {
  if (!node.children) return;
  const out: MdNode[] = [];
  for (const child of node.children) {
    if (child.type === "code" && child.lang === "toc") continue;
    if (child.type === "text" && child.value) {
      const parts = splitShortcodes(child.value);
      if (parts) {
        out.push(...parts);
        continue;
      }
    } else {
      transformShortcodeNodes(child);
    }
    out.push(child);
  }
  node.children = out;
}

/**
 * Remark plugin that expands Foundry shortcodes ([[tilemarker:...]], [[wiki:...]],
 * [toc]{...}, etc.) found in text nodes. Fenced and inline code are separate mdast
 * node types, so shortcodes inside code are skipped structurally and render literally.
 */
function remarkFoundryShortcodes() {
  return (tree: MdNode): void => transformShortcodeNodes(tree);
}

export function MarkdownRenderer({ body }: { body: string }) {
  return (
    <div className="text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkFoundryShortcodes]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
