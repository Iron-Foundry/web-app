import { renderCard, fetchJson, getCached, setCached } from "./utils";
import { ClanStatsCard } from "./clan-stats";
import { CompetitionCard } from "./competition";
import { MemberCard } from "./member";
import type { WomStats, ClanStats, CompetitionFixture, PlayerPublic } from "./types";

const TTL_CLAN = 10 * 60 * 1000;
const TTL_COMP = 5 * 60 * 1000;
const TTL_MEMBER = 15 * 60 * 1000;

export async function serveClanStats(apiUrl: string): Promise<Buffer> {
  const cached = getCached("clan-stats");
  if (cached) return cached;

  const [wom, stats] = await Promise.all([
    fetchJson<WomStats>(`${apiUrl}/clan/wom-stats`),
    fetchJson<ClanStats>(`${apiUrl}/clan/stats`),
  ]);

  const png = await renderCard(ClanStatsCard({ wom, stats }));
  setCached("clan-stats", png, TTL_CLAN);
  return png;
}

export async function serveCompetition(apiUrl: string): Promise<Buffer> {
  const cached = getCached("competition");
  if (cached) return cached;

  let competition: CompetitionFixture | null = null;
  try {
    const all = await fetchJson<CompetitionFixture[]>(`${apiUrl}/clan/competitions`);
    console.log(`[embed] competitions fetched: ${all.length}, statuses: ${[...new Set(all.map(c => c.status))].join(", ")}`);
    competition =
      all.find((c) => c.status === "ongoing") ??
      all.find((c) => c.status === "upcoming") ??
      null;
    if (competition) {
      console.log(`[embed] selected competition: "${competition.title}" (${competition.status}) startsAt=${competition.startsAt} endsAt=${competition.endsAt}`);
      if (!competition.startsAt || !competition.endsAt) {
        console.warn(`[embed] competition missing startsAt/endsAt - falling back to null`);
        competition = null;
      }
    } else {
      console.log(`[embed] no ongoing/upcoming competition found`);
    }
  } catch (err) {
    console.error(`[embed] competition fetch failed:`, err);
  }

  const png = await renderCard(CompetitionCard({ competition }));
  setCached("competition", png, TTL_COMP);
  return png;
}

export async function serveMember(rsn: string, apiUrl: string): Promise<Buffer> {
  const key = `member:${rsn.toLowerCase()}`;
  const cached = getCached(key);
  if (cached) return cached;

  let player: PlayerPublic | null = null;
  try {
    player = await fetchJson<PlayerPublic>(`${apiUrl}/ranking/player/${encodeURIComponent(rsn)}`);
  } catch (err) {
    console.error(`[embed] member fetch failed for "${rsn}":`, err);
  }

  const png = await renderCard(MemberCard({ player }));
  setCached(key, png, TTL_MEMBER);
  return png;
}
