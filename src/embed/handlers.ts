import { renderCard, fetchJson, getCached, setCached } from "./utils";
import { ClanStatsCard } from "./clan-stats";
import { CompetitionCard } from "./competition";
import { CompetitionTop5Card } from "./competition-top5";
import { MemberCard } from "./member";
import type { WomStats, ClanStats, CompetitionFixture, PlayerPublic } from "./types";

interface Participation {
  rank: number;
  player_name: string;
  gained: number;
}

interface MetricDetailResponse {
  participations: Participation[];
}

const TTL_CLAN = 60 * 1000;
const TTL_COMP = 60 * 1000;
const TTL_MEMBER = 60 * 1000;

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
    const [all, metricMap] = await Promise.all([
      fetchJson<CompetitionFixture[]>(`${apiUrl}/clan/competitions`),
      fetchJson<Record<string, string[]>>(`${apiUrl}/clan/competitions/metric-map`).catch(() => ({} as Record<string, string[]>)),
    ]);
    console.log(`[embed] competitions fetched: ${all.length}, statuses: ${[...new Set(all.map(c => c.status))].join(", ")}`);
    const selected =
      all.find((c) => c.status === "ongoing") ??
      all.find((c) => c.status === "upcoming") ??
      null;
    if (selected) {
      console.log(`[embed] selected competition: "${selected.title}" (${selected.status}) startsAt=${selected.startsAt} endsAt=${selected.endsAt}`);
      if (!selected.startsAt || !selected.endsAt) {
        console.warn(`[embed] competition missing startsAt/endsAt - falling back to null`);
      } else {
        const metrics: string[] = metricMap[String(selected.id)] ?? [];
        competition = { ...selected, metrics };
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

export async function serveCompetitionById(id: string, apiUrl: string): Promise<Buffer> {
  const key = `competition-by-id:${id}`;
  const cached = getCached(key);
  if (cached) return cached;

  const [all, metricMap] = await Promise.all([
    fetchJson<CompetitionFixture[]>(`${apiUrl}/clan/competitions`),
    fetchJson<Record<string, string[]>>(`${apiUrl}/clan/competitions/metric-map`).catch(
      () => ({} as Record<string, string[]>),
    ),
  ]);

  const comp = all.find((c) => String(c.id) === id);
  if (!comp) throw new Error(`Competition ${id} not found`);

  const metrics: string[] = metricMap[id] ?? [];
  const png = await renderCard(CompetitionCard({ competition: { ...comp, metrics } }));
  setCached(key, png, TTL_COMP);
  return png;
}

export async function serveCompetitionTop5(
  id: string,
  metric: string,
  apiUrl: string,
): Promise<Buffer> {
  const key = `competition-top5:${id}:${metric}`;
  const cached = getCached(key);
  if (cached) return cached;

  const [all, detail] = await Promise.all([
    fetchJson<CompetitionFixture[]>(`${apiUrl}/clan/competitions`),
    fetchJson<MetricDetailResponse>(
      `${apiUrl}/clan/competitions/${encodeURIComponent(id)}/metric-detail?metric=${encodeURIComponent(metric)}`,
    ),
  ]);

  const comp = all.find((c) => String(c.id) === id);
  if (!comp) throw new Error(`Competition ${id} not found`);

  const top5 = detail.participations.slice(0, 5).map((p) => ({
    rank: p.rank,
    player_name: p.player_name,
    gained: Math.max(0, p.gained),
  }));

  const png = await renderCard(
    CompetitionTop5Card({
      title: comp.title,
      status: comp.status as "ongoing" | "upcoming" | "finished",
      startsAt: comp.startsAt,
      endsAt: comp.endsAt,
      metric,
      top5,
    }),
  );

  setCached(key, png, 60 * 1000);
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
