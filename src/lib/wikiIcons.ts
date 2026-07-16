import { skillSpriteUrl } from "@/lib/skillSprites";

const WIKI = "https://oldschool.runescape.wiki/images";

const BOSS_ICON: Record<string, string> = {
  // tier 1
  barrows_chests:               "Dharok_the_Wretched.png",
  scurrius:                     "Scurrius.png",
  giant_mole:                   "Giant_Mole.png",
  deranged_archaeologist:       "Deranged_archaeologist.png",
  chaos_fanatic:                "Chaos_Fanatic.png",
  crazy_archaeologist:          "Crazy_archaeologist.png",
  obor:                         "Obor.png",
  bryophyta:                    "Bryophyta.png",
  amoxliatl:                    "Amoxliatl.png",
  hespori:                      "Hespori.png",
  kraken:                       "Kraken.png",
  shellbane_gryphon:            "Shellbane_gryphon.png",
  thermonuclear_smoke_devil:    "Thermonuclear_smoke_devil.png",
  // tier 2
  dagannoth_prime:              "Dagannoth_Prime.png",
  dagannoth_rex:                "Dagannoth_Rex.png",
  dagannoth_supreme:            "Dagannoth_Supreme.png",
  scorpia:                      "Scorpia.png",
  king_black_dragon:            "King_Black_Dragon.png",
  grotesque_guardians:          "Dawn.png",
  calvarion:                    "Calvar'ion.png",
  sarachnis:                    "Sarachnis.png",
  the_hueycoatl:                "The_Hueycoatl.png",
  lunar_chests:                 "Lunar_Chest_(closed).png",
  chaos_elemental:              "Chaos_Elemental.png",
  mimic:                        "The_Mimic.png",
  vetion:                       "Vet'ion.png",
  spindel:                      "Spindel.png",
  venenatis:                    "Venenatis.png",
  artio:                        "Artio.png",
  callisto:                     "Callisto.png",
  the_royal_titans:             "Branda_the_Fire_Queen.png",
  skotizo:                      "Skotizo.png",
  abyssal_sire:                 "Abyssal_Sire.png",
  cerberus:                     "Cerberus.png",
  alchemical_hydra:             "Alchemical_Hydra_(serpentine).png",
  kril_tsutsaroth:              "K'ril_Tsutsaroth.png",
  duke_sucellus:                "Duke_Sucellus.png",
  tztok_jad:                    "TzTok-Jad.png",
  // tier 3
  general_graardor:             "General_Graardor.png",
  kreearra:                     "Kree'arra.png",
  kalphite_queen:               "Kalphite_Queen.png",
  commander_zilyana:            "Commander_Zilyana.png",
  corporeal_beast:              "Corporeal_Beast.png",
  zulrah:                       "Zulrah_(tanzanite).png",
  vorkath:                      "Vorkath.png",
  phantom_muspah:               "Phantom_Muspah_(melee).png",
  araxxor:                      "Araxxor.png",
  the_gauntlet:                 "Crystalline_Hunllef.png",
  tombs_of_amascut:             "Tumeken's_Warden_(level-544).png",
  theatre_of_blood:             "Verzik_Vitur.png",
  chambers_of_xeric:            "Great_Olm.png",
  // tier 4
  nex:                          "Nex.png",
  yama:                         "Yama.png",
  nightmare:                    "The_Nightmare.png",  maggot_king:                  "Maggot_King.png",
  the_leviathan:                "The_Leviathan.png",
  the_whisperer:                "The_Whisperer.png",
  vardorvis:                    "Vardorvis.png",
  the_corrupted_gauntlet:       "Corrupted_Hunllef.png",
  chambers_of_xeric_challenge_mode: "Great_Olm.png",
  tombs_of_amascut_expert:      "Tumeken's_Warden_(level-544).png",
  // tier 5
  tzkal_zuk:                    "TzKal-Zuk.png",
  sol_heredit:                  "Sol_Heredit.png",
  phosanis_nightmare:           "The_Nightmare.png",
  doom_of_mokhaiotl:            "Doom_of_Mokhaiotl.png",
  theatre_of_blood_hard_mode:   "Verzik_Vitur.png",
};

export function bossIconUrl(name: string): string {
  const file = BOSS_ICON[name];
  return file ? `${WIKI}/${file}` : "";
}

export function skillIconUrl(name: string): string {
  return skillSpriteUrl(name);
}
