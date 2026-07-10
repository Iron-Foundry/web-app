import { useQuery } from "@tanstack/react-query";

const WIKI_ORIGIN = "https://oldschool.runescape.wiki";

export interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: string;
  url: string;
}

export function wikiTitleFromUrl(href: string): string | null {
  try {
    const url = new URL(href, WIKI_ORIGIN);
    if (url.hostname !== "oldschool.runescape.wiki") return null;
    const match = url.pathname.match(/^\/w\/(.+)$/);
    if (!match) return null;
    return decodeURIComponent(match[1]!).replace(/_/g, " ");
  } catch {
    return null;
  }
}

export function wikiUrlFromTitle(title: string): string {
  return `${WIKI_ORIGIN}/w/${encodeURIComponent(title.trim()).replace(/%20/g, "_")}`;
}

async function fetchWikiSummary(title: string): Promise<WikiSummary> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "extracts|pageimages",
    exintro: "1",
    explaintext: "1",
    redirects: "1",
    pithumbsize: "240",
    titles: title,
    origin: "*",
  });
  const res = await fetch(`${WIKI_ORIGIN}/api.php?${params.toString()}`);
  if (!res.ok) throw new Error(`Wiki request failed: ${res.status}`);
  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0] as
    | { title: string; extract?: string; missing?: string; thumbnail?: { source: string } }
    | undefined;
  if (!page || page.missing !== undefined) throw new Error("Page not found");
  return {
    title: page.title,
    extract: page.extract ?? "",
    thumbnail: page.thumbnail?.source,
    url: wikiUrlFromTitle(page.title),
  };
}

/**
 * Fetches a short OSRS wiki page summary (intro extract and thumbnail).
 * Only runs while enabled so summaries load on hover, not for every link.
 */
export function useWikiSummary(title: string, enabled: boolean) {
  return useQuery({
    queryKey: ["osrs-wiki-summary", title],
    queryFn: () => fetchWikiSummary(title),
    enabled: enabled && title.length > 0,
    staleTime: 1000 * 60 * 60,
  });
}
