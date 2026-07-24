import type { EntryDetail } from "../types/content";

export function wantsMarkdown(accept: string | null): boolean {
  return accept?.toLowerCase().includes("text/markdown") ?? false;
}

export function pageMarkdown(
  title: string,
  description: string,
  entry: EntryDetail | null,
): string {
  if (entry) return `# ${entry.title}\n\n${entry.body}\n`;
  return `# ${title}\n\n${description}\n`;
}

export function markdownHeaders(body: string): Record<string, string> {
  return {
    "Content-Type": "text/markdown; charset=utf-8",
    "Cache-Control": "no-cache",
    Vary: "Accept",
    "X-Content-Type-Options": "nosniff",
    "X-Markdown-Tokens": String(Math.ceil(body.length / 4)),
  };
}
