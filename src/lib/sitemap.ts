interface SitemapEntry {
  slug: string;
  updated_at?: string | null;
}

interface SitemapCategory {
  entries: SitemapEntry[];
  children: SitemapCategory[];
}

const STATIC_PATHS = [
  "/",
  "/about",
  "/rules",
  "/staff",
  "/events",
  "/competitions",
  "/leaderboards",
  "/resources",
  "/plugins",
];

const CONTENT_SECTIONS: Array<{ pageType: string; base: string }> = [
  { pageType: "resource", base: "/resources" },
  { pageType: "plugin", base: "/plugins" },
];

function collectEntries(cats: SitemapCategory[]): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  for (const cat of cats) {
    for (const entry of cat.entries ?? []) out.push(entry);
    if (cat.children?.length) out.push(...collectEntries(cat.children));
  }
  return out;
}

function isoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function urlNode(loc: string, lastmod: string | null): string {
  const body = lastmod ? `<loc>${loc}</loc><lastmod>${lastmod}</lastmod>` : `<loc>${loc}</loc>`;
  return `  <url>${body}</url>`;
}

export async function buildSitemap(siteUrl: string, apiUrl: string): Promise<string> {
  const site = siteUrl.replace(/\/$/, "");
  const paths = new Map<string, string | null>();
  for (const path of STATIC_PATHS) paths.set(path, null);

  for (const { pageType, base } of CONTENT_SECTIONS) {
    try {
      const res = await fetch(`${apiUrl}/content/${pageType}/categories`);
      if (!res.ok) continue;
      const cats = (await res.json()) as SitemapCategory[];
      for (const entry of collectEntries(cats)) {
        paths.set(`${base}/${encodeURIComponent(entry.slug)}`, isoDate(entry.updated_at));
      }
    } catch {
      /* API unreachable - keep the static paths */
    }
  }

  const urls = [...paths]
    .map(([path, lastmod]) => urlNode(`${site}${path === "/" ? "" : path}`, lastmod))
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
