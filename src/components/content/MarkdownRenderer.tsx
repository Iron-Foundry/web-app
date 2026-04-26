import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

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
  h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h4>,
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
  a: ({ href, children }) => {
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
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="border-border my-6" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="text-left p-2 border-b border-border font-semibold bg-muted/50">{children}</th>,
  td: ({ children }) => <td className="p-2 border-b border-border">{children}</td>,
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

export function MarkdownRenderer({ body }: { body: string }) {
  return (
    <div className="text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
