interface SitemapEntry {
  slug: string;
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

function collectSlugs(cats: SitemapCategory[]): string[] {
  const out: string[] = [];
  for (const cat of cats) {
    for (const entry of cat.entries ?? []) out.push(entry.slug);
    if (cat.children?.length) out.push(...collectSlugs(cat.children));
  }
  return out;
}

export async function buildSitemap(siteUrl: string, apiUrl: string): Promise<string> {
  const site = siteUrl.replace(/\/$/, "");
  const paths = new Set(STATIC_PATHS);

  for (const { pageType, base } of CONTENT_SECTIONS) {
    try {
      const res = await fetch(`${apiUrl}/content/${pageType}/categories`);
      if (!res.ok) continue;
      const cats = (await res.json()) as SitemapCategory[];
      for (const slug of collectSlugs(cats)) {
        paths.add(`${base}/${encodeURIComponent(slug)}`);
      }
    } catch {
      /* API unreachable - keep the static paths */
    }
  }

  const urls = [...paths]
    .map((path) => `  <url><loc>${site}${path === "/" ? "" : path}</loc></url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
