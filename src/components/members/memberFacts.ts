import type { AuthUser } from "@/context/AuthContext";
import { INGAME_TO_DISPLAY } from "@/lib/ranks";
import type { AccountRanking, MeStats } from "@/types/members";
import type { Fact } from "./FactStrip";
import { formatGp } from "./feedHelpers";

type FactUser = Pick<AuthUser, "username" | "rsn" | "alts_count" | "clan_rank">;

function logFact(label: string, stats: MeStats): Fact {
  const max = stats.collection_log_slots_max > 0 ? `/ ${stats.collection_log_slots_max.toLocaleString()}` : undefined;
  return { label, value: stats.collection_log_slots.toLocaleString(), sub: max };
}

/** The dashboard's figures, leaving out every one the member has no value for. */
export function dashboardFacts(user: FactUser, stats: MeStats | undefined, topRole: string | null): Fact[] {
  const facts: Fact[] = [{ label: "Discord", value: user.username }];
  if (user.rsn) {
    const alts = user.alts_count > 0 ? `+${user.alts_count} alt${user.alts_count > 1 ? "s" : ""}` : undefined;
    facts.push({ label: "RSN", value: user.rsn, sub: alts });
  }
  if (user.clan_rank) facts.push({ label: "Rank", value: INGAME_TO_DISPLAY[user.clan_rank] ?? user.clan_rank });
  if (topRole) facts.push({ label: "Discord Rank", value: topRole });
  if (stats && stats.collection_log_slots > 0) facts.push(logFact("Collection log", stats));
  if (stats && stats.total_loot_value > 0) facts.push({ label: "Personal loot", value: formatGp(stats.total_loot_value), isScore: true });
  return facts;
}

/** The profile's figures, leaving out every one the member has no value for. */
export function profileFacts(stats: MeStats | undefined, primary: AccountRanking | undefined): Fact[] {
  const facts: Fact[] = [];
  if (stats && stats.collection_log_slots > 0) facts.push(logFact("Collection Log", stats));
  if (stats && stats.total_loot_value > 0) facts.push({ label: "Personal Loot", value: formatGp(stats.total_loot_value) });
  if (primary?.points != null) facts.push({ label: "Ranking Points", value: primary.points.toLocaleString(), isScore: true });
  const tier = primary?.rank ?? stats?.rank_tier;
  if (tier) facts.push({ label: "Rank Tier", value: tier });
  if (primary?.boss_points != null) facts.push({ label: "Boss Points", value: primary.boss_points.toLocaleString() });
  if (primary?.skill_points != null) facts.push({ label: "Skill Points", value: primary.skill_points.toLocaleString() });
  return facts;
}
