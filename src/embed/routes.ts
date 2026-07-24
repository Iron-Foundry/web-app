import {
  serveClanStats,
  serveCompetition,
  serveCompetitionById,
  serveCompetitionTop5,
  serveMember,
  serveContentEntry,
} from "./handlers";
import { renderCard } from "./utils";
import { CompetitionCard } from "./competition";
import { MemberCard } from "./member";
import { ContentEntryCard, type ContentPageType } from "./content-entry";
import { FIXTURES } from "./fixtures";

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
    ["/embed/_fixtures/content-resource.png", "Content - Resource"],
    ["/embed/_fixtures/content-not-found.png", "Content - Not Found"],
  ];

  const items = cards
    .map(
      ([src, label]) => `
    <div style="margin-bottom:24px">
      <div style="font:14px monospace;margin-bottom:6px;color:#888">${label}</div>
      <img src="${src}" style="width:100%;border:1px solid #333;display:block">
    </div>`,
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

export async function handleEmbedRoutes(
  req: Request,
  apiUrl: string,
): Promise<Response | null> {
  const url = new URL(req.url);
  const { pathname } = url;

  if (!pathname.startsWith("/embed/")) return null;

  // --- Live image routes ---

  if (pathname === "/embed/clan-stats.png") {
    return pngResponse(await serveClanStats(apiUrl), 60);
  }

  if (pathname === "/embed/competition.png") {
    return pngResponse(await serveCompetition(apiUrl), 60);
  }

  if (pathname === "/embed/competition-top5.png") {
    const id = url.searchParams.get("id") ?? "";
    const metrics = url.searchParams.getAll("metric");
    const label = url.searchParams.get("label") ?? undefined;
    if (!id || metrics.length === 0) return new Response("Missing id or metric", { status: 400 });
    try {
      const png = await serveCompetitionTop5(id, metrics, apiUrl, label);
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
      return pngResponse(await serveCompetitionById(id, apiUrl), 60);
    } catch (err) {
      console.error(`[embed] competition/${id} failed:`, err);
      return new Response("Not found", { status: 404 });
    }
  }

  const contentEmbedMatch = pathname.match(/^\/embed\/content\/(resource|plugin)\/(.+)\.png$/);
  if (contentEmbedMatch) {
    const pageType = contentEmbedMatch[1] as ContentPageType;
    const slug = decodeURIComponent(contentEmbedMatch[2]!);
    return pngResponse(await serveContentEntry(pageType, slug, apiUrl), 60);
  }

  if (pathname.startsWith("/embed/member/") && pathname.endsWith(".png")) {
    const rsn = decodeURIComponent(pathname.slice("/embed/member/".length, -4));
    return pngResponse(await serveMember(rsn, apiUrl), 60);
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
  if (pathname === "/embed/_fixtures/content-resource.png") {
    return pngResponse(await renderCard(ContentEntryCard(FIXTURES.contentResource)), 0);
  }
  if (pathname === "/embed/_fixtures/content-not-found.png") {
    return pngResponse(await renderCard(ContentEntryCard(FIXTURES.contentNotFound)), 0);
  }

  // --- Dev preview page ---

  if (pathname === "/embed/_preview") {
    return new Response(buildPreviewHtml(), { headers: { "Content-Type": "text/html" } });
  }

  return null;
}
