import { serve } from "bun";
import { join } from "path";

const API_URL = process.env.BUN_PUBLIC_API_URL ?? "http://localhost:8000";
const SITE_URL = (process.env.SITE_URL ?? "https://ironfoundry.cc").replace(/\/$/, "");
const OG_IMAGE = `${SITE_URL}/og-image.png`;

const DIST = join(import.meta.dir, "..", "dist");

interface PageMeta {
  title: string;
  description: string;
}

const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "Iron Foundry",
    description:
      "An Ironman focused Mixed PvM Clan for Old School RuneScape. All skill levels welcome - come join the forge.",
  },
  "/about": {
    title: "About | Iron Foundry",
    description: "Meet the Iron Foundry community - Ironmen and Ironwomen united by a love of OSRS.",
  },
  "/rules": {
    title: "Clan Rules | Iron Foundry",
    description:
      "Iron Foundry's community guidelines. No requirements to join - just bring good vibes.",
  },
  "/staff": {
    title: "Staff | Iron Foundry",
    description: "Meet the Iron Foundry staff team keeping the clan running.",
  },
  "/events": {
    title: "Events | Iron Foundry",
    description: "Upcoming and past clan events for Iron Foundry members.",
  },
  "/members": {
    title: "Members Area | Iron Foundry",
    description: "Your Iron Foundry member dashboard.",
  },
};

function getMeta(pathname: string): PageMeta {
  if (pathname.startsWith("/members")) return PAGE_META["/members"]!;
  return PAGE_META[pathname] ?? PAGE_META["/"]!;
}

function buildOgTags(pathname: string): string {
  const { title, description } = getMeta(pathname);
  const url = `${SITE_URL}${pathname === "/" ? "" : pathname}`;
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<meta property="og:site_name" content="Iron Foundry">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
  ].join("\n    ");
}

const rawHtml = await Bun.file(join(DIST, "index.html")).text();
const baseHtml = rawHtml.replace(
  "<head>",
  `<head><script>window.__API_URL__=${JSON.stringify(API_URL)};</script>`,
);

serve({
  port: 3000,
  async fetch(req) {
    const { pathname } = new URL(req.url);

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

    const html = baseHtml.replace(/<title>[^<]*<\/title>/, buildOgTags(pathname));
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  },
});

console.log(`Production server running on :3000`);
