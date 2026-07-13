function buildXpTable(): number[] {
  const table: number[] = [0];
  let points = 0;
  for (let level = 1; level < 99; level++) {
    points += Math.floor(level + 300 * Math.pow(2, level / 7));
    table.push(Math.floor(points / 4));
  }
  return table;
}

export const XP_TABLE: number[] = buildXpTable();

export function levelFromXp(xp: number): number {
  let lo = 0;
  let hi = XP_TABLE.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((XP_TABLE[mid] ?? 0) <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

export interface SkillMeta {
  key: string;
  label: string;
  wikiSlug: string;
}

export const SKILLS: SkillMeta[] = [
  { key: "attack",       label: "Attack",       wikiSlug: "Attack"       },
  { key: "hitpoints",    label: "Hitpoints",    wikiSlug: "Hitpoints"    },
  { key: "mining",       label: "Mining",       wikiSlug: "Mining"       },
  { key: "strength",     label: "Strength",     wikiSlug: "Strength"     },
  { key: "agility",      label: "Agility",      wikiSlug: "Agility"      },
  { key: "smithing",     label: "Smithing",     wikiSlug: "Smithing"     },
  { key: "defence",      label: "Defence",      wikiSlug: "Defence"      },
  { key: "herblore",     label: "Herblore",     wikiSlug: "Herblore"     },
  { key: "fishing",      label: "Fishing",      wikiSlug: "Fishing"      },
  { key: "ranged",       label: "Ranged",       wikiSlug: "Ranged"       },
  { key: "thieving",     label: "Thieving",     wikiSlug: "Thieving"     },
  { key: "cooking",      label: "Cooking",      wikiSlug: "Cooking"      },
  { key: "prayer",       label: "Prayer",       wikiSlug: "Prayer"       },
  { key: "crafting",     label: "Crafting",     wikiSlug: "Crafting"     },
  { key: "firemaking",   label: "Firemaking",   wikiSlug: "Firemaking"   },
  { key: "magic",        label: "Magic",        wikiSlug: "Magic"        },
  { key: "fletching",    label: "Fletching",    wikiSlug: "Fletching"    },
  { key: "woodcutting",  label: "Woodcutting",  wikiSlug: "Woodcutting"  },
  { key: "runecrafting", label: "Runecrafting", wikiSlug: "Runecraft"    },
  { key: "slayer",       label: "Slayer",       wikiSlug: "Slayer"       },
  { key: "farming",      label: "Farming",      wikiSlug: "Farming"      },
  { key: "construction", label: "Construction", wikiSlug: "Construction" },
  { key: "hunter",       label: "Hunter",       wikiSlug: "Hunter"       },
  { key: "sailing",      label: "Sailing",      wikiSlug: "Sailing"      },
];

export function skillIconUrl(wikiSlug: string): string {
  return `https://oldschool.runescape.wiki/images/${wikiSlug}_icon.png`;
}
