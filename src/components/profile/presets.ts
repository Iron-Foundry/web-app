import type { AccountRanking, PlayerSnapshot } from "@/types/members";

export type WomMetricType = "skill_xp" | "boss_kc" | "activity";
export type ClanMetric = "points" | "boss_points";

export interface PresetGoal {
  id: string;
  title: string;
  unit: string;
  category: "osrs" | "clan";
  // WOM-tracked (osrs presets)
  metricType?: WomMetricType;
  metric?: string;
  // Backend-tracked (clan presets)
  clanMetric?: ClanMetric;
}

export const SKILL_PRESETS: PresetGoal[] = [
  { id: "attack",       title: "Attack",       category: "osrs", metricType: "skill_xp", metric: "attack",       unit: "xp" },
  { id: "strength",     title: "Strength",     category: "osrs", metricType: "skill_xp", metric: "strength",     unit: "xp" },
  { id: "defense",      title: "Defence",      category: "osrs", metricType: "skill_xp", metric: "defence",      unit: "xp" },
  { id: "range",        title: "Ranged",       category: "osrs", metricType: "skill_xp", metric: "ranged",       unit: "xp" },
  { id: "prayer",       title: "Prayer",       category: "osrs", metricType: "skill_xp", metric: "prayer",       unit: "xp" },
  { id: "magic",        title: "Magic",        category: "osrs", metricType: "skill_xp", metric: "magic",        unit: "xp" },
  { id: "hitpoints",    title: "Hitpoints",    category: "osrs", metricType: "skill_xp", metric: "hitpoints",    unit: "xp" },
  { id: "slayer",       title: "Slayer",       category: "osrs", metricType: "skill_xp", metric: "slayer",       unit: "xp" },
  { id: "agility",      title: "Agility",      category: "osrs", metricType: "skill_xp", metric: "agility",      unit: "xp" },
  { id: "herblore",     title: "Herblore",     category: "osrs", metricType: "skill_xp", metric: "herblore",     unit: "xp" },
  { id: "thieving",     title: "Thieving",     category: "osrs", metricType: "skill_xp", metric: "thieving",     unit: "xp" },
  { id: "crafting",     title: "Crafting",     category: "osrs", metricType: "skill_xp", metric: "crafting",     unit: "xp" },
  { id: "fletching",    title: "Fletching",    category: "osrs", metricType: "skill_xp", metric: "fletching",    unit: "xp" },
  { id: "mining",       title: "Mining",       category: "osrs", metricType: "skill_xp", metric: "mining",       unit: "xp" },
  { id: "smithing",     title: "Smithing",     category: "osrs", metricType: "skill_xp", metric: "smithing",     unit: "xp" },
  { id: "fishing",      title: "Fishing",      category: "osrs", metricType: "skill_xp", metric: "fishing",      unit: "xp" },
  { id: "cooking",      title: "Cooking",      category: "osrs", metricType: "skill_xp", metric: "cooking",      unit: "xp" },
  { id: "firemaking",   title: "Firemaking",   category: "osrs", metricType: "skill_xp", metric: "firemaking",   unit: "xp" },
  { id: "woodcutting",  title: "Woodcutting",  category: "osrs", metricType: "skill_xp", metric: "woodcutting",  unit: "xp" },
  { id: "runecrafting", title: "Runecrafting", category: "osrs", metricType: "skill_xp", metric: "runecrafting", unit: "xp" },
  { id: "hunter",       title: "Hunter",       category: "osrs", metricType: "skill_xp", metric: "hunter",       unit: "xp" },
  { id: "construction", title: "Construction", category: "osrs", metricType: "skill_xp", metric: "construction", unit: "xp" },
  { id: "farming",      title: "Farming",      category: "osrs", metricType: "skill_xp", metric: "farming",      unit: "xp" },
  { id: "sailing",      title: "Sailing",      category: "osrs", metricType: "skill_xp", metric: "sailing",      unit: "xp" },
];

export const BOSS_PRESETS: PresetGoal[] = [
  { id: "abyssal_sire",              title: "Abyssal Sire",              category: "osrs", metricType: "boss_kc", metric: "abyssal_sire",              unit: "kc" },
  { id: "alchemical_hydra",          title: "Alchemical Hydra",          category: "osrs", metricType: "boss_kc", metric: "alchemical_hydra",          unit: "kc" },
  { id: "amoxliatl",                 title: "Amoxliatl",                 category: "osrs", metricType: "boss_kc", metric: "amoxliatl",                 unit: "kc" },
  { id: "araxxor",                   title: "Araxxor",                   category: "osrs", metricType: "boss_kc", metric: "araxxor",                   unit: "kc" },
  { id: "artio",                     title: "Artio",                     category: "osrs", metricType: "boss_kc", metric: "artio",                     unit: "kc" },
  { id: "barrows_chests",            title: "Barrows Chests",            category: "osrs", metricType: "boss_kc", metric: "barrows_chests",            unit: "kc" },
  { id: "bryophyta",                 title: "Bryophyta",                 category: "osrs", metricType: "boss_kc", metric: "bryophyta",                 unit: "kc" },
  { id: "callisto",                  title: "Callisto",                  category: "osrs", metricType: "boss_kc", metric: "callisto",                  unit: "kc" },
  { id: "calvarion",                 title: "Calvar'ion",                category: "osrs", metricType: "boss_kc", metric: "calvarion",                 unit: "kc" },
  { id: "cerberus",                  title: "Cerberus",                  category: "osrs", metricType: "boss_kc", metric: "cerberus",                  unit: "kc" },
  { id: "chambers_of_xeric",         title: "Chambers of Xeric",         category: "osrs", metricType: "boss_kc", metric: "chambers_of_xeric",         unit: "kc" },
  { id: "chambers_of_xeric_cm",      title: "Chambers of Xeric (CM)",    category: "osrs", metricType: "boss_kc", metric: "chambers_of_xeric_challenge_mode", unit: "kc" },
  { id: "chaos_elemental",           title: "Chaos Elemental",           category: "osrs", metricType: "boss_kc", metric: "chaos_elemental",           unit: "kc" },
  { id: "chaos_fanatic",             title: "Chaos Fanatic",             category: "osrs", metricType: "boss_kc", metric: "chaos_fanatic",             unit: "kc" },
  { id: "commander_zilyana",         title: "Commander Zilyana",         category: "osrs", metricType: "boss_kc", metric: "commander_zilyana",         unit: "kc" },
  { id: "corporeal_beast",           title: "Corporeal Beast",           category: "osrs", metricType: "boss_kc", metric: "corporeal_beast",           unit: "kc" },
  { id: "crazy_archaeologist",       title: "Crazy Archaeologist",       category: "osrs", metricType: "boss_kc", metric: "crazy_archaeologist",       unit: "kc" },
  { id: "dagannoth_prime",           title: "Dagannoth Prime",           category: "osrs", metricType: "boss_kc", metric: "dagannoth_prime",           unit: "kc" },
  { id: "dagannoth_rex",             title: "Dagannoth Rex",             category: "osrs", metricType: "boss_kc", metric: "dagannoth_rex",             unit: "kc" },
  { id: "dagannoth_supreme",         title: "Dagannoth Supreme",         category: "osrs", metricType: "boss_kc", metric: "dagannoth_supreme",         unit: "kc" },
  { id: "deranged_archaeologist",    title: "Deranged Archaeologist",    category: "osrs", metricType: "boss_kc", metric: "deranged_archaeologist",    unit: "kc" },
  { id: "duke_sucellus",             title: "Duke Sucellus",             category: "osrs", metricType: "boss_kc", metric: "duke_sucellus",             unit: "kc" },
  { id: "general_graardor",          title: "General Graardor",          category: "osrs", metricType: "boss_kc", metric: "general_graardor",          unit: "kc" },
  { id: "giant_mole",                title: "Giant Mole",                category: "osrs", metricType: "boss_kc", metric: "giant_mole",                unit: "kc" },
  { id: "grotesque_guardians",       title: "Grotesque Guardians",       category: "osrs", metricType: "boss_kc", metric: "grotesque_guardians",       unit: "kc" },
  { id: "hespori",                   title: "Hespori",                   category: "osrs", metricType: "boss_kc", metric: "hespori",                   unit: "kc" },
  { id: "hueycoatl",                 title: "Hueycoatl",                 category: "osrs", metricType: "boss_kc", metric: "hueycoatl",                 unit: "kc" },
  { id: "kalphite_queen",            title: "Kalphite Queen",            category: "osrs", metricType: "boss_kc", metric: "kalphite_queen",            unit: "kc" },
  { id: "king_black_dragon",         title: "King Black Dragon",         category: "osrs", metricType: "boss_kc", metric: "king_black_dragon",         unit: "kc" },
  { id: "kraken",                    title: "Kraken",                    category: "osrs", metricType: "boss_kc", metric: "kraken",                    unit: "kc" },
  { id: "kreearra",                  title: "Kree'arra",                 category: "osrs", metricType: "boss_kc", metric: "kreearra",                  unit: "kc" },
  { id: "kril_tsutsaroth",           title: "K'ril Tsutsaroth",          category: "osrs", metricType: "boss_kc", metric: "kril_tsutsaroth",           unit: "kc" },
  { id: "lunar_chests",              title: "Lunar Chests",              category: "osrs", metricType: "boss_kc", metric: "lunar_chests",              unit: "kc" },
  { id: "mimic",                     title: "The Mimic",                 category: "osrs", metricType: "boss_kc", metric: "mimic",                     unit: "kc" },
  { id: "nex",                       title: "Nex",                       category: "osrs", metricType: "boss_kc", metric: "nex",                       unit: "kc" },
  { id: "nightmare",                 title: "The Nightmare",             category: "osrs", metricType: "boss_kc", metric: "nightmare",                 unit: "kc" },
  { id: "phosanis_nightmare",        title: "Phosani's Nightmare",       category: "osrs", metricType: "boss_kc", metric: "phosanis_nightmare",        unit: "kc" },
  { id: "obor",                      title: "Obor",                      category: "osrs", metricType: "boss_kc", metric: "obor",                      unit: "kc" },
  { id: "phantom_muspah",            title: "Phantom Muspah",            category: "osrs", metricType: "boss_kc", metric: "phantom_muspah",            unit: "kc" },
  { id: "sarachnis",                 title: "Sarachnis",                 category: "osrs", metricType: "boss_kc", metric: "sarachnis",                 unit: "kc" },
  { id: "scorpia",                   title: "Scorpia",                   category: "osrs", metricType: "boss_kc", metric: "scorpia",                   unit: "kc" },
  { id: "scurrius",                  title: "Scurrius",                  category: "osrs", metricType: "boss_kc", metric: "scurrius",                  unit: "kc" },
  { id: "skotizo",                   title: "Skotizo",                   category: "osrs", metricType: "boss_kc", metric: "skotizo",                   unit: "kc" },
  { id: "sol_heredit",               title: "Sol Heredit",               category: "osrs", metricType: "boss_kc", metric: "sol_heredit",               unit: "kc" },
  { id: "spindel",                   title: "Spindel",                   category: "osrs", metricType: "boss_kc", metric: "spindel",                   unit: "kc" },
  { id: "tempoross",                 title: "Tempoross",                 category: "osrs", metricType: "boss_kc", metric: "tempoross",                 unit: "kc" },
  { id: "the_corrupted_gauntlet",    title: "The Corrupted Gauntlet",    category: "osrs", metricType: "boss_kc", metric: "the_corrupted_gauntlet",    unit: "kc" },
  { id: "the_gauntlet",              title: "The Gauntlet",              category: "osrs", metricType: "boss_kc", metric: "the_gauntlet",              unit: "kc" },
  { id: "the_leviathan",             title: "The Leviathan",             category: "osrs", metricType: "boss_kc", metric: "the_leviathan",             unit: "kc" },
  { id: "the_whisperer",             title: "The Whisperer",             category: "osrs", metricType: "boss_kc", metric: "the_whisperer",             unit: "kc" },
  { id: "theatre_of_blood",          title: "Theatre of Blood",          category: "osrs", metricType: "boss_kc", metric: "theatre_of_blood",          unit: "kc" },
  { id: "theatre_of_blood_hm",       title: "Theatre of Blood (HM)",     category: "osrs", metricType: "boss_kc", metric: "theatre_of_blood_hard_mode", unit: "kc" },
  { id: "thermonuclear_smoke_devil", title: "Thermonuclear Smoke Devil", category: "osrs", metricType: "boss_kc", metric: "thermonuclear_smoke_devil", unit: "kc" },
  { id: "tombs_of_amascut",          title: "Tombs of Amascut",          category: "osrs", metricType: "boss_kc", metric: "tombs_of_amascut",          unit: "kc" },
  { id: "tombs_of_amascut_expert",   title: "Tombs of Amascut (Expert)", category: "osrs", metricType: "boss_kc", metric: "tombs_of_amascut_expert_mode", unit: "kc" },
  { id: "tzkal_zuk",                 title: "TzKal-Zuk",                 category: "osrs", metricType: "boss_kc", metric: "tzkal_zuk",                 unit: "kc" },
  { id: "tztok_jad",                 title: "TzTok-Jad",                 category: "osrs", metricType: "boss_kc", metric: "tztok_jad",                 unit: "kc" },
  { id: "vardorvis",                 title: "Vardorvis",                 category: "osrs", metricType: "boss_kc", metric: "vardorvis",                 unit: "kc" },
  { id: "venenatis",                 title: "Venenatis",                 category: "osrs", metricType: "boss_kc", metric: "venenatis",                 unit: "kc" },
  { id: "vetion",                    title: "Vet'ion",                   category: "osrs", metricType: "boss_kc", metric: "vetion",                    unit: "kc" },
  { id: "vorkath",                   title: "Vorkath",                   category: "osrs", metricType: "boss_kc", metric: "vorkath",                   unit: "kc" },
  { id: "wintertodt",                title: "Wintertodt",                category: "osrs", metricType: "boss_kc", metric: "wintertodt",                unit: "kc" },
  { id: "zalcano",                   title: "Zalcano",                   category: "osrs", metricType: "boss_kc", metric: "zalcano",                   unit: "kc" },
  { id: "zulrah",                    title: "Zulrah",                    category: "osrs", metricType: "boss_kc", metric: "zulrah",                    unit: "kc" },
];

export const CLUE_PRESETS: PresetGoal[] = [
  { id: "clue_scrolls_all",      title: "Clue Scrolls (All)",      category: "osrs", metricType: "activity", metric: "clue_scrolls_all",      unit: "clues" },
  { id: "clue_scrolls_beginner", title: "Clue Scrolls (Beginner)", category: "osrs", metricType: "activity", metric: "clue_scrolls_beginner", unit: "clues" },
  { id: "clue_scrolls_easy",     title: "Clue Scrolls (Easy)",     category: "osrs", metricType: "activity", metric: "clue_scrolls_easy",     unit: "clues" },
  { id: "clue_scrolls_medium",   title: "Clue Scrolls (Medium)",   category: "osrs", metricType: "activity", metric: "clue_scrolls_medium",   unit: "clues" },
  { id: "clue_scrolls_hard",     title: "Clue Scrolls (Hard)",     category: "osrs", metricType: "activity", metric: "clue_scrolls_hard",     unit: "clues" },
  { id: "clue_scrolls_elite",    title: "Clue Scrolls (Elite)",    category: "osrs", metricType: "activity", metric: "clue_scrolls_elite",    unit: "clues" },
  { id: "clue_scrolls_master",   title: "Clue Scrolls (Master)",   category: "osrs", metricType: "activity", metric: "clue_scrolls_master",   unit: "clues" },
];

export const CLAN_PRESETS: PresetGoal[] = [
  { id: "rank_score",   title: "Rank Score",   category: "clan", unit: "pts", clanMetric: "points"      },
  { id: "boss_points",  title: "Boss Points",  category: "clan", unit: "pts", clanMetric: "boss_points" },
];

export function getSnapshotCurrent(preset: PresetGoal, snapshot: PlayerSnapshot): number {
  if (!preset.metricType || !preset.metric) return 0;
  if (preset.metricType === "skill_xp") return snapshot.skills[preset.metric] ?? 0;
  if (preset.metricType === "boss_kc")  return snapshot.bosses[preset.metric] ?? 0;
  return snapshot.activities[preset.metric] ?? 0;
}

export function getClanCurrent(preset: PresetGoal, rankings: AccountRanking[], rsn: string): number {
  const row = rankings.find((r) => r.rsn.toLowerCase() === rsn.toLowerCase());
  if (!row || !preset.clanMetric) return 0;
  return row[preset.clanMetric] ?? 0;
}
