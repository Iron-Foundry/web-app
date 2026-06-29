import type { PbEntry } from "@/types/leaderboard";

export type Grouped = Record<string, Record<string, PbEntry[]>>;

export interface RaidGroup {
  groupKey: string;
  activities: string[];
}

const RAID_PATTERNS: Array<{ regex: RegExp; groupKey: string }> = [
  { regex: /^Chambers of Xeric \(Team Size: .+\)$/,              groupKey: "cox"        },
  { regex: /^Chambers of Xeric Challenge Mode \(Team Size: .+\)$/, groupKey: "cox-cm"   },
  { regex: /^Theatre of Blood \(Team Size: .+\)$/,               groupKey: "tob"        },
  { regex: /^Theatre of Blood: Entry mode \(Team Size: .+\)$/,   groupKey: "tob-entry"  },
  { regex: /^Theatre of Blood: Hard mode \(Team Size: .+\)$/,    groupKey: "tob-hard"   },
  { regex: /^Tombs of Amascut \(team size: .+\) Entry mode$/,    groupKey: "toa-entry"  },
  { regex: /^Tombs of Amascut \(team size: .+\) Normal mode$/,   groupKey: "toa-normal" },
  { regex: /^Tombs of Amascut \(team size: .+\) Expert mode$/,   groupKey: "toa-expert" },
];

export function raidGroupKey(activity: string): string | null {
  for (const { regex, groupKey } of RAID_PATTERNS) {
    if (regex.test(activity)) return groupKey;
  }
  return null;
}

function teamSizeSortKey(activity: string): number {
  const m = activity.match(/(?:Team Size|team size):\s*(Solo|(\d+))/i);
  if (!m) return 999;
  if (!m[2]) return 1;
  return parseInt(m[2], 10);
}

function canonicalPlayerKey(playerName: string): string {
  return playerName.split(" and ").map((n) => n.trim().toLowerCase()).sort().join("|");
}

function dedupeEntries(entries: PbEntry[]): PbEntry[] {
  const best = new Map<string, PbEntry>();
  for (const e of entries) {
    const key = canonicalPlayerKey(e.player_name);
    const existing = best.get(key);
    if (!existing || e.time_seconds < existing.time_seconds) best.set(key, e);
  }
  return Array.from(best.values());
}

export function groupPbs(entries: PbEntry[]): Grouped {
  const out: Grouped = {};
  for (const e of entries) {
    const key = e.variant || "";
    const byVariant = (out[e.activity] ??= {});
    (byVariant[key] ??= []).push(e);
  }
  for (const byVariant of Object.values(out)) {
    for (const [variant, rows] of Object.entries(byVariant)) {
      byVariant[variant] = dedupeEntries(rows);
    }
  }
  return out;
}

export function buildRaidGroups(grouped: Grouped): Map<string, RaidGroup> {
  const map = new Map<string, RaidGroup>();
  for (const activity of Object.keys(grouped)) {
    const key = raidGroupKey(activity);
    if (!key) continue;
    if (!map.has(key)) map.set(key, { groupKey: key, activities: [] });
    map.get(key)!.activities.push(activity);
  }
  for (const group of map.values()) {
    group.activities.sort((a, b) => teamSizeSortKey(a) - teamSizeSortKey(b));
  }
  return map;
}
