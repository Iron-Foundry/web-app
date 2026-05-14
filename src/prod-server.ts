import { serve } from "bun";
import { join } from "path";
import { serveClanStats, serveCompetition, serveMember } from "./embed/handlers";
import { renderCard } from "./embed/utils";
import { ClanStatsCard } from "./embed/clan-stats";
import { CompetitionCard } from "./embed/competition";
import { MemberCard } from "./embed/member";
import { FIXTURES } from "./embed/fixtures";

const PUBLIC_API_URL = process.env.BUN_PUBLIC_API_URL ?? "http://localhost:8000";
const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? PUBLIC_API_URL;
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
  "/competitions": {
    title: "Competitions | Iron Foundry",
    description: "Active and upcoming clan competitions for Iron Foundry members.",
  },
  "/leaderboards": {
    title: "Leaderboards | Iron Foundry",
    description: "Iron Foundry clan leaderboards - boss kills, collection log, and more.",
  },
};

function getMeta(pathname: string): PageMeta {
  if (pathname.startsWith("/members")) return PAGE_META["/members"]!;
  return PAGE_META[pathname] ?? PAGE_META["/"]!;
}

function getOgImage(pathname: string): string {
  if (pathname === "/" || pathname === "/leaderboards")
    return `${SITE_URL}/embed/clan-stats.png`;
  if (pathname.startsWith("/competitions"))
    return `${SITE_URL}/embed/competition.png`;
  return OG_IMAGE;
}

function isDynamicOg(pathname: string): boolean {
  return pathname === "/" || pathname === "/leaderboards" || pathname.startsWith("/competitions");
}

function buildOgTags(pathname: string): string {
  const { title, description } = getMeta(pathname);
  const url = `${SITE_URL}${pathname === "/" ? "" : pathname}`;
  const ogImage = getOgImage(pathname);
  const twitterCard = isDynamicOg(pathname) ? "summary_large_image" : "summary";
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<meta property="og:site_name" content="Iron Foundry">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta name="twitter:card" content="${twitterCard}">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
  ].join("\n    ");
}

function pngResponse(png: Buffer, maxAgeSeconds: number): Response {
  return new Response(png as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": `public, max-age=${maxAgeSeconds}, s-maxage=0`,
    },
  });
}

function buildPreviewHtml(): string {
  const cards = [
    ["/embed/clan-stats.png", "Clan Stats (live)"],
    ["/embed/competition.png", "Competition (live)"],
    ["/embed/_fixtures/competition-upcoming.png", "Competition - Upcoming"],
    ["/embed/_fixtures/competition-none.png", "Competition - None"],
    ["/embed/member/LD salt.png", "Member (live)"],
    ["/embed/_fixtures/member-opted-out.png", "Member - Opted Out"],
    ["/embed/_fixtures/member-unlinked.png", "Member - Unlinked"],
    ["/embed/_fixtures/member-not-found.png", "Member - Not Found"],
  ];

  const items = cards
    .map(
      ([src, label]) => `
    <div style="margin-bottom:24px">
      <div style="font:14px monospace;margin-bottom:6px;color:#888">${label}</div>
      <img src="${src}" style="width:100%;border:1px solid #333;display:block">
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><title>Embed Preview</title>
<style>body{background:#0a0a0a;margin:0;padding:32px;box-sizing:border-box;max-width:900px}</style>
</head>
<body>${items}</body>
</html>`;
}

const rawHtml = await Bun.file(join(DIST, "index.html")).text();
const baseHtml = rawHtml.replace(
  "<head>",
  `<head><script>window.__API_URL__=${JSON.stringify(PUBLIC_API_URL)};</script>`,
);

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;
    // --- Embed image routes ---

    if (pathname === "/embed/clan-stats.png") {
      const png = await serveClanStats(INTERNAL_API_URL);
      return pngResponse(png, 600);
    }

    if (pathname === "/embed/competition.png") {
      const png = await serveCompetition(INTERNAL_API_URL);
      return pngResponse(png, 300);
    }

    if (pathname.startsWith("/embed/member/") && pathname.endsWith(".png")) {
      const rsn = decodeURIComponent(pathname.slice("/embed/member/".length, -4));
      const png = await serveMember(rsn, INTERNAL_API_URL);
      return pngResponse(png, 900);
    }

    // --- Fixture routes (preview only, never cached by CDN) ---

    if (pathname === "/embed/_fixtures/competition-upcoming.png") {
      return pngResponse(await renderCard(CompetitionCard({ competition: FIXTURES.competitionUpcoming })), 0);
    }
    if (pathname === "/embed/_fixtures/competition-none.png") {
      return pngResponse(await renderCard(CompetitionCard({ competition: FIXTURES.competitionNone })), 0);
    }
    if (pathname === "/embed/_fixtures/member-opted-out.png") {
      return pngResponse(await renderCard(MemberCard({ player: FIXTURES.memberOptedOut })), 0);
    }
    if (pathname === "/embed/_fixtures/member-unlinked.png") {
      return pngResponse(await renderCard(MemberCard({ player: FIXTURES.memberUnlinked })), 0);
    }
    if (pathname === "/embed/_fixtures/member-not-found.png") {
      return pngResponse(await renderCard(MemberCard({ player: FIXTURES.memberNotFound })), 0);
    }

    // --- Dev preview page ---

    if (pathname === "/embed/_preview") {
      return new Response(buildPreviewHtml(), { headers: { "Content-Type": "text/html" } });
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
