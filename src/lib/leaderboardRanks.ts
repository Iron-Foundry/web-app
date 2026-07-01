import { INGAME_TO_DISPLAY } from "@/lib/ranks";

export const GEM_RANKS = [
  "Guest", "Achiever", "Sapphire", "Emerald", "Ruby",
  "Diamond", "Dragonstone", "Onyx", "Zenyte",
] as const;

export const GEM_RANKS_SET = new Set<string>(GEM_RANKS);

export const GEM_RANK_COLOR: Record<string, string> = {
  Sapphire:    "text-blue-400",
  Emerald:     "text-emerald-400",
  Ruby:        "text-red-400",
  Diamond:     "text-cyan-300",
  Dragonstone: "text-violet-400",
  Onyx:        "text-slate-400",
  Zenyte:      "text-orange-400",
  Achiever:    "text-muted-foreground",
  Guest:       "text-muted-foreground",
};

export const GEM_RANK_DOT_COLOR: Record<string, string> = {
  Sapphire:    "bg-blue-400",
  Emerald:     "bg-emerald-400",
  Ruby:        "bg-red-400",
  Diamond:     "bg-cyan-300",
  Dragonstone: "bg-violet-400",
  Onyx:        "bg-slate-400",
  Zenyte:      "bg-orange-400",
  Achiever:    "bg-muted-foreground",
  Guest:       "bg-muted-foreground",
};

export const WOM_RANK_COLOR: Record<string, string> = {
  "Rank 10": "text-yellow-500 font-semibold",
  "Rank 9":  "text-amber-500 font-semibold",
  "Rank 8":  "text-orange-500",
  "Rank 7":  "text-purple-500",
  "Rank 6":  "text-violet-500",
  "Rank 5":  "text-indigo-500",
  "Rank 4":  "text-blue-500",
  "Rank 3":  "text-teal-500",
  "Rank 2":  "text-green-600",
  "Rank 1":  "text-muted-foreground",
  "No Rank": "text-muted-foreground",
};

export const ALL_WOM_RANKS = [
  "Rank 10", "Rank 9", "Rank 8", "Rank 7", "Rank 6",
  "Rank 5", "Rank 4", "Rank 3", "Rank 2", "Rank 1", "No Rank",
];

export const GEM_RANK_HEX: Record<string, string> = {
  Zenyte:      "#fb923c",
  Onyx:        "#94a3b8",
  Dragonstone: "#a78bfa",
  Diamond:     "#67e8f9",
  Ruby:        "#f87171",
  Emerald:     "#34d399",
  Sapphire:    "#60a5fa",
  Achiever:    "#6b7280",
  Guest:       "#374151",
};

export const WOM_RANK_HEX: Record<string, string> = {
  "Rank 10": "#eab308",
  "Rank 9":  "#f59e0b",
  "Rank 8":  "#f97316",
  "Rank 7":  "#a855f7",
  "Rank 6":  "#8b5cf6",
  "Rank 5":  "#6366f1",
  "Rank 4":  "#3b82f6",
  "Rank 3":  "#14b8a6",
  "Rank 2":  "#16a34a",
  "Rank 1":  "#94a3b8",
  "No Rank": "#334155",
};

export const WOM_RANK_BAR_COLOR: Record<string, string> = {
  "Rank 10": "bg-yellow-500",
  "Rank 9":  "bg-amber-500",
  "Rank 8":  "bg-orange-500",
  "Rank 7":  "bg-purple-500",
  "Rank 6":  "bg-violet-500",
  "Rank 5":  "bg-indigo-500",
  "Rank 4":  "bg-blue-500",
  "Rank 3":  "bg-teal-500",
  "Rank 2":  "bg-green-600",
  "Rank 1":  "bg-muted-foreground",
  "No Rank": "bg-muted",
};

export function resolveFilterRank(e: { clan_rank?: string | null; discord_rank?: string | null }): string | null {
  if (e.discord_rank) {
    const match = GEM_RANKS.find((r) => r.toLowerCase() === e.discord_rank!.toLowerCase());
    if (match) return match;
  }
  const display = INGAME_TO_DISPLAY[e.clan_rank ?? ""];
  return display && GEM_RANKS_SET.has(display) ? display : null;
}

export function gemRankCounts(
  entries: { clan_rank?: string | null; discord_rank?: string | null }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    const r = resolveFilterRank(e);
    if (r) counts[r] = (counts[r] ?? 0) + 1;
  }
  return counts;
}
