import { serve } from "bun";
import { join } from "path";
import { handleEmbedRoutes } from "./embed/routes";
import { fetchJson, markdownExcerpt } from "./embed/utils";
import type { ContentPageType } from "./embed/content-entry";
import type { CompetitionFixture } from "./embed/types";
import type { EntryDetail } from "./types/content";
import { securityHeaders } from "./lib/security";
import { buildSitemap } from "./lib/sitemap";
import { apiCatalog, linkHeader } from "./lib/agent-discovery";
import { wantsMarkdown, pageMarkdown, markdownHeaders } from "./lib/markdown-negotiation";
import {
  organizationLd,
  websiteLd,
  breadcrumbLd,
  articleLd,
  renderJsonLd,
} from "./lib/structured-data";

const PUBLIC_API_URL = process.env.BUN_PUBLIC_API_URL ?? "http://localhost:8000";
const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? PUBLIC_API_URL;
const SITE_URL = (process.env.SITE_URL ?? "https://ironfoundry.cc").replace(/\/$/, "");
const OG_IMAGE = `${SITE_URL}/og-image.png`;

const DIST = join(import.meta.dir, "..", "dist");

interface PageMeta {
  title: string;
  description: string;
}

const CONTENT_BASES: Record<string, ContentPageType> = {
  resources: "resource",
  plugins: "plugin",
};

interface ContentOg {
  pageType: ContentPageType;
  slug: string;
  entry: EntryDetail | null;
}

function matchContentEntry(pathname: string): { pageType: ContentPageType; slug: string } | null {
  const m = pathname.match(/^\/(resources|plugins)\/([^/]+)$/);
  if (!m) return null;
  return { pageType: CONTENT_BASES[m[1]!]!, slug: decodeURIComponent(m[2]!) };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const KEYWORDS =
  "Iron Foundry, OSRS clan, Ironman clan, OSRS Ironman clan, Old School RuneScape clan, " +
  "iron clan, PvM clan, social clan, mixed PvM, Ironman, Ironwoman, OSRS";

const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "Iron Foundry - OSRS Ironman Clan",
    description:
      "Iron Foundry is a social OSRS Ironman clan - mixed PvM, all skill levels welcome. " +
      "Old School RuneScape Ironmen and Ironwomen, come join the forge.",
  },
  "/about": {
    title: "About | Iron Foundry OSRS Ironman Clan",
    description:
      "Meet Iron Foundry - a social OSRS Ironman clan of Ironmen and Ironwomen who love " +
      "mixed PvM in Old School RuneScape.",
  },
  "/rules": {
    title: "Clan Rules | Iron Foundry OSRS Clan",
    description:
      "Iron Foundry's community guidelines. No requirements to join our OSRS Ironman clan - " +
      "just bring good vibes.",
  },
  "/staff": {
    title: "Staff | Iron Foundry OSRS Clan",
    description: "Meet the Iron Foundry staff team keeping our OSRS Ironman clan running.",
  },
  "/events": {
    title: "Events | Iron Foundry OSRS Clan",
    description: "Upcoming and past clan events for Iron Foundry, a social OSRS Ironman clan.",
  },
  "/members": {
    title: "Members Area | Iron Foundry",
    description: "Your Iron Foundry member dashboard.",
  },
  "/competitions": {
    title: "Competitions | Iron Foundry OSRS Clan",
    description: "Active and upcoming clan competitions for Iron Foundry, an OSRS Ironman clan.",
  },
  "/leaderboards": {
    title: "Leaderboards | Iron Foundry OSRS Clan",
    description: "Iron Foundry OSRS clan leaderboards - boss kills, collection log, and more.",
  },
};

function getMeta(pathname: string): PageMeta {
  if (pathname.startsWith("/members")) return PAGE_META["/members"]!;
  if (pathname.startsWith("/competitions")) return PAGE_META["/competitions"]!;
  return PAGE_META[pathname] ?? PAGE_META["/"]!;
}

function getOgImage(pathname: string, epoch: number, compId?: string, content?: ContentOg): string {
  if (content)
    return `${SITE_URL}/embed/content/${content.pageType}/${encodeURIComponent(content.slug)}.png?t=${epoch}`;
  if (pathname === "/" || pathname === "/leaderboards")
    return `${SITE_URL}/embed/clan-stats.png?t=${epoch}`;
  if (compId)
    return `${SITE_URL}/embed/competition/${compId}.png?t=${epoch}`;
  if (pathname.startsWith("/competitions"))
    return `${SITE_URL}/embed/competition.png?t=${epoch}`;
  return OG_IMAGE;
}

function isDynamicOg(pathname: string, content?: ContentOg): boolean {
  return (
    content !== undefined ||
    pathname === "/" ||
    pathname === "/leaderboards" ||
    pathname.startsWith("/competitions")
  );
}

function buildOgTags(
  pathname: string,
  epoch: number,
  comp?: CompetitionFixture,
  content?: ContentOg,
): string {
  let { title, description } = getMeta(pathname);
  const compId = comp ? String(comp.id) : undefined;

  if (comp) {
    const statusLabel =
      comp.status === "ongoing" ? "Ongoing" :
      comp.status === "upcoming" ? "Upcoming" :
      "Finished";
    title = `${comp.title} | Iron Foundry`;
    description = `${statusLabel} Iron Foundry competition - ${comp.participantCount ?? 0} participants.`;
  }

  if (content?.entry) {
    const section = content.pageType === "plugin" ? "Plugins" : "Resources & Guides";
    title = `${content.entry.title} | Iron Foundry`;
    description = markdownExcerpt(content.entry.body) || `${section} - Iron Foundry.`;
  }

  const url = `${SITE_URL}${pathname === "/" ? "" : pathname}`;
  const ogImage = getOgImage(pathname, epoch, compId, content);
  const isArticle = Boolean(content?.entry);
  const twitterCard = isDynamicOg(pathname, content) ? "summary_large_image" : "summary";
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const tags = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDescription}">`,
    `<meta name="keywords" content="${KEYWORDS}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<meta property="og:site_name" content="Iron Foundry">`,
    `<meta property="og:type" content="${isArticle ? "article" : "website"}">`,
    `<meta property="og:title" content="${safeTitle}">`,
    `<meta property="og:description" content="${safeDescription}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:logo" content="${OG_IMAGE}">`,
    `<meta name="twitter:card" content="${twitterCard}">`,
    `<meta name="twitter:title" content="${safeTitle}">`,
    `<meta name="twitter:description" content="${safeDescription}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
  ];

  if (content?.entry) {
    const entry = content.entry;
    if (entry.created_at)
      tags.push(`<meta property="article:published_time" content="${escapeHtml(entry.created_at)}">`);
    if (entry.updated_at)
      tags.push(`<meta property="article:modified_time" content="${escapeHtml(entry.updated_at)}">`);
    const authorName = entry.author?.rsn ?? entry.author?.discord_username;
    if (authorName)
      tags.push(`<meta property="article:author" content="${escapeHtml(authorName)}">`);
  }

  return tags.join("\n    ");
}

function buildStructuredData(
  pathname: string,
  epoch: number,
  comp: CompetitionFixture | undefined,
  content: ContentOg | undefined,
  nonce: string,
): string {
  const url = `${SITE_URL}${pathname === "/" ? "" : pathname}`;
  const compId = comp ? String(comp.id) : undefined;
  const ogImage = getOgImage(pathname, epoch, compId, content);
  const nodes = [];

  if (pathname === "/") {
    nodes.push(organizationLd(SITE_URL, OG_IMAGE), websiteLd(SITE_URL));
  }

  if (content?.entry) {
    nodes.push(articleLd(url, ogImage, content.entry));
    nodes.push(breadcrumbLd(SITE_URL, pathname, content.entry.title));
  } else {
    nodes.push(breadcrumbLd(SITE_URL, pathname, comp?.title));
  }

  return renderJsonLd(nodes, nonce);
}

const rawHtml = await Bun.file(join(DIST, "index.html")).text();

function renderDocument(
  pathname: string,
  epoch: number,
  comp: CompetitionFixture | undefined,
  content: ContentOg | undefined,
  nonce: string,
): string {
  const head = buildOgTags(pathname, epoch, comp, content);
  const structuredData = buildStructuredData(pathname, epoch, comp, content, nonce);
  return rawHtml
    .replace(`<script type="importmap">`, `<script type="importmap" nonce="${nonce}">`)
    .replace(
      "<head>",
      `<head><script nonce="${nonce}">window.__API_URL__=${JSON.stringify(PUBLIC_API_URL)};</script>`,
    )
    .replace(
      /<title>[^<]*<\/title>/,
      structuredData ? `${head}\n    ${structuredData}` : head,
    );
}

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;

    // --- Embed image + preview routes (shared with the dev server) ---

    const embedResponse = await handleEmbedRoutes(req, INTERNAL_API_URL);
    if (embedResponse) return embedResponse;

    // --- Agent discovery: RFC 9727 API catalog (RFC 8288 Link on HTML) ---

    if (pathname === "/.well-known/api-catalog") {
      return new Response(apiCatalog(PUBLIC_API_URL), {
        headers: {
          "Content-Type": "application/linkset+json",
          "Cache-Control": "public, max-age=3600",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // --- Sitemap (live: static pages + content entry slugs) ---

    if (pathname === "/sitemap.xml") {
      const xml = await buildSitemap(SITE_URL, INTERNAL_API_URL);
      return new Response(xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // --- Static assets ---

    if (pathname !== "/" && pathname.includes(".")) {
      const file = Bun.file(join(DIST, pathname));
      if (await file.exists()) {
        const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
        const cacheControl =
          ext === "js" || ext === "css"
            ? "public, max-age=31536000, immutable"
            : "public, max-age=86400";
        return new Response(file, { headers: { "Cache-Control": cacheControl } });
      }
    }

    // --- SPA fallback ---

    const epoch = Math.floor(Date.now() / 1000);
    let comp: CompetitionFixture | undefined;
    const compIdMatch = pathname.match(/^\/competitions\/(\d+)$/);
    if (compIdMatch) {
      try {
        const all = await fetchJson<CompetitionFixture[]>(`${INTERNAL_API_URL}/clan/competitions`);
        comp = all.find((c) => String(c.id) === compIdMatch[1]);
      } catch { /* fall back to generic meta */ }
    }

    let content: ContentOg | undefined;
    const contentMatch = matchContentEntry(pathname);
    if (contentMatch) {
      let entry: EntryDetail | null = null;
      try {
        entry = await fetchJson<EntryDetail>(
          `${INTERNAL_API_URL}/content/${contentMatch.pageType}/entries/by-slug/${encodeURIComponent(contentMatch.slug)}`,
        );
      } catch { /* fall back to section image + generic meta */ }
      content = { ...contentMatch, entry };
    }

    // --- Markdown content negotiation (Accept: text/markdown) ---

    if (wantsMarkdown(req.headers.get("accept"))) {
      const meta = getMeta(pathname);
      const md = pageMarkdown(meta.title, meta.description, content?.entry ?? null);
      return new Response(md, { headers: markdownHeaders(md) });
    }

    const nonce = crypto.randomUUID();
    const html = renderDocument(pathname, epoch, comp, content, nonce);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        Vary: "Accept",
        Link: linkHeader(PUBLIC_API_URL),
        ...securityHeaders(PUBLIC_API_URL, nonce),
      },
    });
  },
});

console.log(`Production server running on :3000`);
