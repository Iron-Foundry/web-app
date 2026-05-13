import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import type { CSSProperties } from "react";
import { slugify, headingText } from "@/lib/utils";
import { EntryRef } from "./EntryRef";

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

const components: Components = {
  h1: ({ children }) => {
    const id = slugify(headingText(children)) || undefined;
    return <h1 id={id} className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>;
  },
  h2: ({ children }) => {
    const id = slugify(headingText(children)) || undefined;
    return <h2 id={id} className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>;
  },
  h3: ({ children }) => {
    const id = slugify(headingText(children)) || undefined;
    return <h3 id={id} className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h3>;
  },
  h4: ({ children }) => {
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
      const ytId = extractYouTubeId(href);
      if (ytId) {
        return (
          <div className="relative my-4" style={{ paddingTop: "56.25%" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}`}
              className="absolute inset-0 w-full h-full rounded-md"
              allowFullScreen
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
  img: ({ src, alt }) => <img src={src} alt={alt ?? ""} className="max-w-full rounded-md my-2" />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  video: ({ src, ...props }: any) => (
    <video src={src} controls className="max-w-full rounded-md my-2" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kbd: ({ children }: any) => (
    <kbd className="font-mono text-xs border border-border rounded px-1.5 py-0.5 bg-muted shadow-sm">
      {children}
    </kbd>
  ),
};

function preprocessMarkdown(body: string): string {
  return body
    // Convert [[type:slug#section|display]] wiki-links to data-attribute anchors
    // so the `a` component override can render them as EntryRef hover cards.
    .replace(
      /\[\[(\w+):([a-z0-9-]+)(?:#([a-z0-9-]+))?(?:\|([^\]]+))?\]\]/g,
      (_, type, slug, section, display) => {
        const text = (display as string | undefined) || (slug as string);
        const sec = section ? ` data-section="${section as string}"` : "";
        return `<a data-entry-ref="true" data-type="${type as string}" data-slug="${slug as string}"${sec}>${text}</a>`;
      },
    )
    // Fix missing slash on closing inline tags: <tag>text<tag> → <tag>text</tag>
    .replace(/<(code|strong|em|b|i|u|s|kbd|mark|sub|sup)>([^<]*)<\1>/g, "<$1>$2</$1>")
    // Keep div blocks together so rehype-raw can reconstruct them
    .replace(/(<div\b[^>]*>)\n\n/g, "$1\n")
    .replace(/\n\n(<\/div>)/g, "\n$1");
}

export function MarkdownRenderer({ body }: { body: string }) {
  return (
    <div className="text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {preprocessMarkdown(body)}
      </ReactMarkdown>
    </div>
  );
}
