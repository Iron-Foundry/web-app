import type { BingoMappedData, BingoSubmission } from "@/types/bingo";

export const SKILL_METRICS = new Set([
  "overall","attack","defence","strength","hitpoints","ranged","prayer","magic",
  "cooking","woodcutting","fletching","fishing","firemaking","crafting","smithing",
  "mining","herblore","agility","thieving","slayer","farming","runecrafting",
  "hunter","construction","sailing",
]);

export const BOSS_METRICS = new Set([
  "abyssal_sire","alchemical_hydra","amoxliatl","araxxor","artio","barrows_chests",
  "brutus","bryophyta","callisto","calvarion","cerberus","chambers_of_xeric",
  "chambers_of_xeric_challenge_mode","chaos_elemental","chaos_fanatic","commander_zilyana",
  "corporeal_beast","crazy_archaeologist","dagannoth_prime","dagannoth_rex","dagannoth_supreme",
  "deranged_archaeologist","doom_of_mokhaiotl","duke_sucellus","general_graardor","giant_mole",
  "grotesque_guardians","hespori","kalphite_queen","king_black_dragon","kraken","kreearra",
  "kril_tsutsaroth","lunar_chests","nex","nightmare","obor","phantom_muspah","phosanis_nightmare",
  "sarachnis","scorpia","scurrius","shellbane_gryphon","skotizo","sol_heredit","spindel",
  "tempoross","the_corrupted_gauntlet","the_gauntlet","the_hueycoatl","the_leviathan",
  "the_royal_titans","the_whisperer","theatre_of_blood","theatre_of_blood_hard_mode",
  "thermonuclear_smoke_devil","tombs_of_amascut","tombs_of_amascut_expert","tzkal_zuk",
  "tztok_jad","vardorvis","venenatis","vetion","vorkath","wintertodt","yama","zalcano","zulrah",
]);

export const ACTIVITY_METRICS = new Set([
  "clue_scrolls_all","clue_scrolls_beginner","clue_scrolls_easy","clue_scrolls_medium",
  "clue_scrolls_hard","clue_scrolls_elite","clue_scrolls_master","collections_logged",
  "colosseum_glory","guardians_of_the_rift","last_man_standing","pvp_arena","soul_wars_zeal",
]);

export const COMPUTED_METRICS = new Set(["ehp", "ehb"]);

export const TEAM_COLORS = [
  "hsl(220,70%,55%)", "hsl(140,60%,45%)", "hsl(280,65%,60%)", "hsl(30,80%,55%)",
  "hsl(0,65%,55%)", "hsl(180,55%,45%)", "hsl(55,75%,50%)", "hsl(320,65%,60%)",
];

export interface FlatPlayer {
  rsn: string;
  teamName: string;
  teamColor: string;
  is_captain: boolean;
  wom_metrics: Record<string, number> | null;
  submissions: BingoSubmission[];
}

export function buildTeamColor(teamNames: string[]): Record<string, string> {
  return Object.fromEntries(
    teamNames.map((n, i) => [n, TEAM_COLORS[i % TEAM_COLORS.length] ?? "#888"]),
  );
}

export function buildAllPlayers(
  bingoData: BingoMappedData,
  teamColor: Record<string, string>,
): FlatPlayer[] {
  const players: FlatPlayer[] = [];
  for (const [teamName, team] of Object.entries(bingoData.teams)) {
    for (const [rsn, player] of Object.entries(team.players)) {
      players.push({
        rsn,
        teamName,
        teamColor: teamColor[teamName] ?? "#888",
        is_captain: player.is_captain,
        wom_metrics: player.wom_metrics,
        submissions: player.bingo_submissions,
      });
    }
  }
  return players;
}

export function buildActiveMetrics(players: FlatPlayer[]): string[] {
  const sums: Record<string, number> = {};
  for (const p of players) {
    if (!p.wom_metrics) continue;
    for (const [k, v] of Object.entries(p.wom_metrics)) {
      sums[k] = (sums[k] ?? 0) + v;
    }
  }
  return Object.keys(sums).filter((k) => (sums[k] ?? 0) > 0);
}

export function buildActiveByCategory(activeMetrics: string[]) {
  return {
    skill: activeMetrics.filter((m) => SKILL_METRICS.has(m)).sort(),
    boss: activeMetrics.filter((m) => BOSS_METRICS.has(m)).sort(),
    activity: activeMetrics.filter((m) => ACTIVITY_METRICS.has(m)).sort(),
    computed: activeMetrics.filter((m) => COMPUTED_METRICS.has(m)).sort(),
  };
}

export function fmtBingoMetric(m: string): string {
  return m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fmtBingoGained(v: number, metric: string): string {
  if (SKILL_METRICS.has(metric)) {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M xp`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}K xp`;
    return `${v} xp`;
  }
  return v.toLocaleString();
}

export function fmtBingoDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export function getMetricCat(m: string): "skill" | "boss" | "activity" | "computed" {
  if (SKILL_METRICS.has(m)) return "skill";
  if (BOSS_METRICS.has(m)) return "boss";
  if (ACTIVITY_METRICS.has(m)) return "activity";
  return "computed";
}

export function getMetricVal(p: FlatPlayer, metric: string): number {
  return p.wom_metrics?.[metric] ?? 0;
}

export function rankLabel(r: number): string {
  if (r === 1) return "🥇";
  if (r === 2) return "🥈";
  if (r === 3) return "🥉";
  return `#${r}`;
}
