import { serve } from "bun";
import { join } from "path";
import { serveClanStats, serveCompetition, serveCompetitionById, serveCompetitionTop5, serveMember } from "./embed/handlers";
import { renderCard, fetchJson } from "./embed/utils";
import type { CompetitionFixture } from "./embed/types";
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
  if (pathname.startsWith("/competitions")) return PAGE_META["/competitions"]!;
  return PAGE_META[pathname] ?? PAGE_META["/"]!;
}

function getOgImage(pathname: string, epoch: number, compId?: string): string {
  if (pathname === "/" || pathname === "/leaderboards")
    return `${SITE_URL}/embed/clan-stats.png?t=${epoch}`;
  if (compId)
    return `${SITE_URL}/embed/competition/${compId}.png?t=${epoch}`;
  if (pathname.startsWith("/competitions"))
    return `${SITE_URL}/embed/competition.png?t=${epoch}`;
  return OG_IMAGE;
}

function isDynamicOg(pathname: string): boolean {
  return pathname === "/" || pathname === "/leaderboards" || pathname.startsWith("/competitions");
}

function buildOgTags(
  pathname: string,
  epoch: number,
  comp?: CompetitionFixture,
): string {
  let { title, description } = getMeta(pathname);
  const compId = comp ? String(comp.id) : undefined;

  if (comp) {
    const statusLabel =
      comp.status === "ongoing" ? "Ongoing" :
      comp.status === "upcoming" ? "Upcoming" :
      "Finished";
    title = `${comp.title} | Iron Foundry`;
    description = `${statusLabel} Iron Foundry competition — ${comp.participantCount ?? 0} participants.`;
  }

  const url = `${SITE_URL}${pathname === "/" ? "" : pathname}`;
  const ogImage = getOgImage(pathname, epoch, compId);
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
    `<meta property="og:logo" content="${OG_IMAGE}">`,
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
      return pngResponse(png, 60);
    }

    if (pathname === "/embed/competition.png") {
      const png = await serveCompetition(INTERNAL_API_URL);
      return pngResponse(png, 60);
    }

    if (pathname === "/embed/competition-top5.png") {
      const id = url.searchParams.get("id") ?? "";
      const metric = url.searchParams.get("metric") ?? "";
      if (!id || !metric) return new Response("Missing id or metric", { status: 400 });
      try {
        const png = await serveCompetitionTop5(id, metric, INTERNAL_API_URL);
        return new Response(png as unknown as BodyInit, {
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="competition-top5.png"`,
            "Cache-Control": "no-store",
          },
        });
      } catch (err) {
        console.error("[embed] competition-top5 failed:", err);
        return new Response("Failed to render", { status: 500 });
      }
    }

    const compEmbedMatch = pathname.match(/^\/embed\/competition\/(\d+)\.png$/);
    if (compEmbedMatch) {
      const id = compEmbedMatch[1]!;
      try {
        const png = await serveCompetitionById(id, INTERNAL_API_URL);
        return pngResponse(png, 60);
      } catch (err) {
        console.error(`[embed] competition/${id} failed:`, err);
        return new Response("Not found", { status: 404 });
      }
    }

    if (pathname.startsWith("/embed/member/") && pathname.endsWith(".png")) {
      const rsn = decodeURIComponent(pathname.slice("/embed/member/".length, -4));
      const png = await serveMember(rsn, INTERNAL_API_URL);
      return pngResponse(png, 60);
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

    const epoch = Math.floor(Date.now() / 1000);
    let comp: CompetitionFixture | undefined;
    const compIdMatch = pathname.match(/^\/competitions\/(\d+)$/);
    if (compIdMatch) {
      try {
        const all = await fetchJson<CompetitionFixture[]>(`${INTERNAL_API_URL}/clan/competitions`);
        comp = all.find((c) => String(c.id) === compIdMatch[1]);
      } catch { /* fall back to generic meta */ }
    }

    const html = baseHtml.replace(/<title>[^<]*<\/title>/, buildOgTags(pathname, epoch, comp));
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  },
});

console.log(`Production server running on :3000`);
