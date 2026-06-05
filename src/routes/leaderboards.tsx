import { useState, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { registerPage } from "@/lib/permissions";
import {
  LeaderboardSkeleton,
  LeaderboardListSkeleton,
  RankingTabSkeleton,
} from "@/components/skeletons/LeaderboardSkeleton";
import { cn } from "@/lib/utils";
import { INGAME_TO_DISPLAY } from "@/lib/ranks";
import { LayoutList, LayoutGrid, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  usePbLeaderboard,
  useClogLeaderboard,
  useKillcountLeaderboard,
  useLeagueLeaderboard,
  useRankingResults,
  useRankingStats,
} from "@/hooks/useLeaderboards";
import type { PbEntry, ClogEntry, KcBoss, LeaguesEntry, LeaderboardTab } from "@/types/leaderboard";

registerPage({
  id: "leaderboards",
  label: "Leaderboards",
  description: "Clan skill and activity leaderboards.",
  defaults: { read: [], create: ["Senior Moderator"], edit: ["Senior Moderator"], delete: ["Senior Moderator"] },
});

export const leaderboardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboards",
  component: LeaderboardsPage,
});

// ── Rank config ────────────────────────────────────────────────────────────────

const GEM_RANKS = [
  "Guest", "Achiever", "Sapphire", "Emerald", "Ruby",
  "Diamond", "Dragonstone", "Onyx", "Zenyte",
] as const;

const GEM_RANKS_SET = new Set<string>(GEM_RANKS);

function resolveFilterRank(e: { clan_rank?: string | null; discord_rank?: string | null }): string | null {
  if (e.discord_rank) {
    const match = GEM_RANKS.find((r) => r.toLowerCase() === e.discord_rank!.toLowerCase());
    if (match) return match;
  }
  const display = INGAME_TO_DISPLAY[e.clan_rank ?? ""];
  return display && GEM_RANKS_SET.has(display) ? display : null;
}

const GEM_RANK_COLOR: Record<string, string> = {
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

const WOM_RANK_COLOR: Record<string, string> = {
  "Rank 6":  "text-yellow-500 font-semibold",
  "Rank 5":  "text-amber-500 font-semibold",
  "Rank 4":  "text-orange-500",
  "Rank 3":  "text-blue-500",
  "Rank 2":  "text-green-500",
  "Rank 1":  "text-muted-foreground",
  "No Rank": "text-muted-foreground",
};

const ALL_WOM_RANKS = ["Rank 6", "Rank 5", "Rank 4", "Rank 3", "Rank 2", "Rank 1", "No Rank"];

const GEM_RANK_HEX: Record<string, string> = {
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

const WOM_RANK_HEX: Record<string, string> = {
  "Rank 6":  "#eab308",
  "Rank 5":  "#f59e0b",
  "Rank 4":  "#f97316",
  "Rank 3":  "#3b82f6",
  "Rank 2":  "#22c55e",
  "Rank 1":  "#94a3b8",
  "No Rank": "#334155",
};

const WOM_RANK_BAR_COLOR: Record<string, string> = {
  "Rank 6":  "bg-yellow-500",
  "Rank 5":  "bg-amber-500",
  "Rank 4":  "bg-orange-500",
  "Rank 3":  "bg-blue-500",
  "Rank 2":  "bg-green-500",
  "Rank 1":  "bg-muted-foreground",
  "No Rank": "bg-muted",
};

// ── Density ────────────────────────────────────────────────────────────────────

type Density = "comfortable" | "compact";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const wholeSec = Math.floor(s % 60);
  const cs = Math.round((s % 1) * 100);
  const secStr = `${String(wholeSec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${secStr}`;
  return `${m}:${secStr}`;
}

function rankLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function fmtNum(n: number | null | undefined) {
  if (n == null) return "-";
  return n.toLocaleString();
}

type Grouped = Record<string, Record<string, PbEntry[]>>;

function groupPbs(entries: PbEntry[]): Grouped {
  const out: Grouped = {};
  for (const e of entries) {
    const key = e.variant || "";
    const byVariant = (out[e.activity] ??= {});
    (byVariant[key] ??= []).push(e);
  }
  return out;
}

/** Count player appearances per GEM_RANKS bucket. Uses discord_rank for primaries, falls back to in-game display for alts/unlinked (only if already a GEM_RANK). */
function gemRankCounts(entries: { clan_rank?: string | null; discord_rank?: string | null }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    const r = resolveFilterRank(e);
    if (r) counts[r] = (counts[r] ?? 0) + 1;
  }
  return counts;
}

// ── Rank filter pills ──────────────────────────────────────────────────────────

function RankFilterPills({
  active,
  onChange,
  compact,
  counts,
}: {
  active: string | null;
  onChange: (r: string | null) => void;
  compact: boolean;
  counts?: Record<string, number>;
}) {
  const total = counts ? Object.values(counts).reduce((s, n) => s + n, 0) : null;
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "rounded-full px-3 py-0.5 font-medium transition-colors border",
          compact && "px-2 py-px text-xs",
          active === null
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
        )}
      >
        {total !== null ? `All (${total})` : "All"}
      </button>
      {GEM_RANKS.map((r) => {
        const count = counts?.[r];
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={cn(
              "rounded-full px-3 py-0.5 font-medium transition-colors border text-sm",
              compact && "px-2 py-px text-xs",
              active === r
                ? "border-primary bg-primary text-primary-foreground"
                : cn("border-border hover:border-primary", GEM_RANK_COLOR[r]),
            )}
          >
            {count !== undefined ? `${r} (${count})` : r}
          </button>
        );
      })}
    </div>
  );
}

// ── Search bar ─────────────────────────────────────────────────────────────────

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search..."}
        className="pl-8 h-8 text-sm"
      />
    </div>
  );
}

// ── RankRow / RankHeader ───────────────────────────────────────────────────────

function RankRow({
  rank,
  name,
  value,
  compact,
  highlight,
}: {
  rank: number;
  name: string;
  value: React.ReactNode;
  compact: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_1fr_auto] gap-x-4 items-center border-b border-border last:border-0 hover:bg-muted/40 rounded-sm",
        compact ? "py-0.5" : "py-1.5",
        highlight && "ring-1 ring-primary/60 bg-primary/5 rounded-sm px-1 -mx-1",
      )}
    >
      <span className="text-xs text-muted-foreground">{rankLabel(rank)}</span>
      <span className={cn("font-medium text-foreground truncate", compact && "text-xs")}>{name}</span>
      {value}
    </div>
  );
}

function RankHeader({ valueLabel, compact }: { valueLabel: string; compact: boolean }) {
  return (
    <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 border-b border-border pb-1 text-xs text-muted-foreground">
      <span>Rank</span>
      <span>Player</span>
      <span className={compact ? "text-xs" : ""}>{valueLabel}</span>
    </div>
  );
}

// ── Raid carousel ──────────────────────────────────────────────────────────────

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

const RAID_GROUP_ORDER = RAID_PATTERNS.map((p) => p.groupKey);

function raidGroupKey(activity: string): string | null {
  for (const { regex, groupKey } of RAID_PATTERNS) {
    if (regex.test(activity)) return groupKey;
  }
  return null;
}

function teamSizeSortKey(activity: string): number {
  // "Solo" → 1, numeric → that number, ranges "11-15 players" → 11
  const m = activity.match(/(?:Team Size|team size):\s*(Solo|(\d+))/i);
  if (!m) return 999;
  if (!m[2]) return 1; // Solo
  return parseInt(m[2], 10);
}

interface RaidGroup {
  groupKey: string;
  activities: string[]; // sorted by team size ascending
}

function buildRaidGroups(grouped: Grouped): Map<string, RaidGroup> {
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

const PB_CLAMP = 6;

function PbVariantRows({
  variantMap,
  clamp,
  compact,
  exactMatch,
}: {
  variantMap: Record<string, PbEntry[]>;
  clamp: boolean;
  compact: boolean;
  exactMatch?: string;
}) {
  const variants = Object.keys(variantMap).sort();
  return (
    <>
      {variants.map((variant) => {
        const allRows = variantMap[variant] ?? [];
        let rows = clamp ? allRows.slice(0, PB_CLAMP) : allRows;
        let swappedRank: number | null = null;

        if (clamp && exactMatch) {
          const matchIdx = allRows.findIndex((e) => e.player_name.toLowerCase() === exactMatch);
          if (matchIdx >= PB_CLAMP) {
            rows = [...allRows.slice(0, PB_CLAMP - 1), allRows[matchIdx]!];
            swappedRank = matchIdx + 1;
          }
        }

        return (
          <div key={variant} className={compact ? "space-y-0" : "space-y-1"}>
            {variant && (
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {variant}
              </p>
            )}
            <div className="w-full text-sm">
              <RankHeader valueLabel="Time" compact={compact} />
              {rows.map((entry, i) => (
                <RankRow
                  key={entry.player_name}
                  rank={swappedRank !== null && i === rows.length - 1 ? swappedRank : i + 1}
                  name={entry.player_name}
                  compact={compact}
                  highlight={!!exactMatch && entry.player_name.toLowerCase() === exactMatch}
                  value={
                    <Badge
                      variant="secondary"
                      className={cn("font-rs-bold tabular-nums", compact ? "text-xs px-1.5 py-0" : "text-xs")}
                    >
                      {formatTime(entry.time_seconds)}
                    </Badge>
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ── Flat list types for virtualised sheet ──────────────────────────────────────

type SheetItem =
  | { kind: "variant-header"; label: string }
  | { kind: "col-header" }
  | { kind: "row"; entry: PbEntry; rank: number };

const SHEET_ITEM_HEIGHT: Record<SheetItem["kind"], number> = {
  "variant-header": 32,
  "col-header":     28,
  "row":            37,
};

function buildSheetItems(variantMap: Record<string, PbEntry[]>): SheetItem[] {
  const variants = Object.keys(variantMap).sort();
  const hasNamedVariants = variants.some((v) => v !== "");
  const items: SheetItem[] = [];
  for (const variant of variants) {
    const rows = variantMap[variant] ?? [];
    if (hasNamedVariants && variant) items.push({ kind: "variant-header", label: variant });
    items.push({ kind: "col-header" });
    rows.forEach((entry, i) => items.push({ kind: "row", entry, rank: i + 1 }));
  }
  return items;
}

function PbSheetList({ variantMap }: { variantMap: Record<string, PbEntry[]> }) {
  const items = buildSheetItems(variantMap);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => SHEET_ITEM_HEIGHT[(items[i]?.kind ?? "row") as SheetItem["kind"]],
    overscan: 20,
  });

  return (
    <div ref={parentRef} className="overflow-y-auto flex-1 px-6">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const item = items[vItem.index]!;
          return (
            <div
              key={vItem.key}
              data-index={vItem.index}
              ref={virtualizer.measureElement}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vItem.start}px)` }}
            >
              {item.kind === "variant-header" && (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-4 pb-1">
                  {item.label}
                </p>
              )}
              {item.kind === "col-header" && (
                <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 border-b border-border pb-1 text-xs text-muted-foreground">
                  <span>Rank</span><span>Player</span><span>Time</span>
                </div>
              )}
              {item.kind === "row" && (
                <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 items-center border-b border-border last:border-0 hover:bg-muted/40 rounded-sm py-1.5">
                  <span className="text-xs text-muted-foreground">{rankLabel(item.rank)}</span>
                  <span className="font-medium text-foreground truncate">{item.entry.player_name}</span>
                  <Badge variant="secondary" className="font-rs-bold tabular-nums text-xs">
                    {formatTime(item.entry.time_seconds)}
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PbSheet({
  open,
  onOpenChange,
  title,
  variantMap,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  variantMap: Record<string, PbEntry[]>;
}) {
  const total = Object.values(variantMap).reduce((s, r) => s + r.length, 0);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="font-rs-bold text-primary text-lg leading-tight">{title}</SheetTitle>
          <p className="text-xs text-muted-foreground">{total.toLocaleString()} records</p>
        </SheetHeader>
        <PbSheetList variantMap={variantMap} />
      </SheetContent>
    </Sheet>
  );
}

function RaidCarouselCard({
  group,
  grouped,
  compact,
  exactMatch,
}: {
  group: RaidGroup;
  grouped: Grouped;
  compact: boolean;
  exactMatch?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetActivity, setSheetActivity] = useState<string | null>(null);

  useEffect(() => {
    if (!exactMatch) return;
    const matchIdx = group.activities.findIndex((act) =>
      Object.values(grouped[act] ?? {}).flat().some(
        (e) => e.player_name.toLowerCase() === exactMatch,
      ),
    );
    if (matchIdx !== -1) setIdx(matchIdx);
  }, [exactMatch, group.activities, grouped]);

  const activities = group.activities;
  const safeIdx = Math.min(idx, activities.length - 1);
  const currentActivity = activities[safeIdx]!;
  const variantMap = grouped[currentActivity]!;
  const multi = activities.length > 1;

  const totalRows = Object.values(variantMap).reduce((s, rows) => s + rows.length, 0);
  const hasMore = Object.values(variantMap).some((rows) => rows.length > PB_CLAMP);

  const go = (dir: "left" | "right") => {
    setSlideDir(dir);
    setAnimKey((k) => k + 1);
    setIdx((i) =>
      dir === "left"
        ? (i - 1 + activities.length) % activities.length
        : (i + 1) % activities.length,
    );
  };

  const openSheet = () => {
    setSheetActivity(currentActivity);
    setSheetOpen(true);
  };

  const sheetVarMap = (sheetActivity ? grouped[sheetActivity] : null) ?? variantMap;
  const sheetTitle = sheetActivity ?? currentActivity;

  return (
    <>
      <Card className={compact ? "p-0" : undefined}>
        <CardHeader className={cn("pb-2", compact && "px-3 pt-3 pb-1")}>
          <div className="flex items-start justify-between gap-2">
            <h2 className={cn("font-rs-bold text-primary leading-tight", compact ? "text-base" : "text-xl")}>
              {currentActivity}
            </h2>
            {multi && (
              <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                <button
                  onClick={() => go("left")}
                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  aria-label="Previous team size"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-muted-foreground tabular-nums w-9 text-center select-none">
                  {safeIdx + 1} / {activities.length}
                </span>
                <button
                  onClick={() => go("right")}
                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  aria-label="Next team size"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-4 pt-0 overflow-hidden", compact && "px-3 pb-2 space-y-2")}>
          <div
            key={animKey}
            className={cn(
              slideDir !== null && "animate-in fade-in-0 duration-200",
              slideDir === "right" && "slide-in-from-right-3",
              slideDir === "left" && "slide-in-from-left-3",
            )}
          >
            <PbVariantRows variantMap={variantMap} clamp compact={compact} exactMatch={exactMatch} />
          </div>
          {hasMore && (
            <button
              onClick={openSheet}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border pt-2 text-center"
            >
              View all {totalRows} records
            </button>
          )}
        </CardContent>
      </Card>
      <PbSheet open={sheetOpen} onOpenChange={setSheetOpen} title={sheetTitle} variantMap={sheetVarMap} />
    </>
  );
}

function NonRaidCard({
  activity,
  variantMap,
  compact,
  exactMatch,
}: {
  activity: string;
  variantMap: Record<string, PbEntry[]>;
  compact: boolean;
  exactMatch?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const totalRows = Object.values(variantMap).reduce((s, rows) => s + rows.length, 0);
  const hasMore = Object.values(variantMap).some((rows) => rows.length > PB_CLAMP);

  return (
    <>
      <Card className={compact ? "p-0" : undefined}>
        <CardHeader className={cn("pb-2", compact && "px-3 pt-3 pb-1")}>
          <h2 className={cn("font-rs-bold text-primary", compact ? "text-base" : "text-xl")}>
            {activity}
          </h2>
        </CardHeader>
        <CardContent className={cn("space-y-4 pt-0", compact && "px-3 pb-2 space-y-2")}>
          <PbVariantRows variantMap={variantMap} clamp compact={compact} exactMatch={exactMatch} />
          {hasMore && (
            <button
              onClick={() => setSheetOpen(true)}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border pt-2 text-center"
            >
              View all {totalRows} records
            </button>
          )}
        </CardContent>
      </Card>
      <PbSheet open={sheetOpen} onOpenChange={setSheetOpen} title={activity} variantMap={variantMap} />
    </>
  );
}

// ── Tab: Personal Bests ────────────────────────────────────────────────────────

function PbLeaderboardTab({ compact }: { compact: boolean }) {
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data: entries = [], isLoading } = usePbLeaderboard();

  if (isLoading) return <LeaderboardSkeleton />;

  const counts = gemRankCounts(entries);
  const filtered = rankFilter ? entries.filter((e) => resolveFilterRank(e) === rankFilter) : entries;
  const grouped = groupPbs(filtered);
  const activities = Object.keys(grouped).sort();

  const raidGroups = buildRaidGroups(grouped);

  type CardItem =
    | { type: "raid"; group: RaidGroup; sortKey: string }
    | { type: "non-raid"; activity: string; sortKey: string };

  const cards: CardItem[] = [];
  for (const group of raidGroups.values()) {
    cards.push({ type: "raid", group, sortKey: group.activities[0] ?? group.groupKey });
  }
  for (const activity of activities) {
    if (raidGroupKey(activity) === null) cards.push({ type: "non-raid", activity, sortKey: activity });
  }
  cards.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const q = search.trim().toLowerCase();
  const visibleCards = q
    ? cards.filter((card) => {
        if (card.type === "non-raid") {
          if (card.activity.toLowerCase().includes(q)) return true;
          return Object.values(grouped[card.activity] ?? {}).flat()
            .some((e) => e.player_name.toLowerCase().includes(q));
        }
        return card.group.activities.some((act) => {
          if (act.toLowerCase().includes(q)) return true;
          return Object.values(grouped[act] ?? {}).flat()
            .some((e) => e.player_name.toLowerCase().includes(q));
        });
      })
    : cards;

  const cols = compact ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-1 md:grid-cols-3";

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} placeholder="Search activity or player..." />
      <RankFilterPills active={rankFilter} onChange={setRankFilter} compact={compact} counts={counts} />
      {visibleCards.length === 0 ? (
        <p className="text-sm text-muted-foreground">No times match this filter.</p>
      ) : (
        <div className={cn("grid gap-4", cols)}>
          {visibleCards.map((card) =>
            card.type === "raid" ? (
              <RaidCarouselCard key={card.group.groupKey} group={card.group} grouped={grouped} compact={compact} exactMatch={q || undefined} />
            ) : (
              <NonRaidCard key={card.activity} activity={card.activity} variantMap={grouped[card.activity]!} compact={compact} exactMatch={q || undefined} />
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Killcount sheet + card ──────────────────────────────────────────────────────

const KC_CLAMP = 10;

type KcEntry = KcBoss["entries"][number];

function KcSheetList({ entries }: { entries: KcEntry[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length + 1, // +1 for col-header
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (i === 0 ? 28 : 37),
    overscan: 20,
  });

  return (
    <div ref={parentRef} className="overflow-y-auto flex-1 px-6">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((vItem) => (
          <div
            key={vItem.key}
            data-index={vItem.index}
            ref={virtualizer.measureElement}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vItem.start}px)` }}
          >
            {vItem.index === 0 ? (
              <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 border-b border-border pb-1 text-xs text-muted-foreground">
                <span>Rank</span><span>Player</span><span>KC</span>
              </div>
            ) : (
              (() => {
                const entry = entries[vItem.index - 1]!;
                const rank = vItem.index;
                return (
                  <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 items-center border-b border-border last:border-0 hover:bg-muted/40 rounded-sm py-1.5">
                    <span className="text-xs text-muted-foreground">{rankLabel(rank)}</span>
                    <span className="font-medium text-foreground truncate">{entry.player_name}</span>
                    <Badge variant="secondary" className="font-rs-bold tabular-nums text-xs">
                      {entry.kills.toLocaleString()}
                    </Badge>
                  </div>
                );
              })()
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function KcBossCard({ boss, compact, exactMatch }: { boss: KcBoss; compact: boolean; exactMatch?: string }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  let displayed = boss.entries.slice(0, KC_CLAMP);
  let swappedRank: number | null = null;

  if (exactMatch) {
    const matchIdx = boss.entries.findIndex((e) => e.player_name.toLowerCase() === exactMatch);
    if (matchIdx >= KC_CLAMP) {
      displayed = [...boss.entries.slice(0, KC_CLAMP - 1), boss.entries[matchIdx]!];
      swappedRank = matchIdx + 1;
    }
  }

  const hasMore = boss.entries.length > KC_CLAMP;

  return (
    <>
      <Card className={compact ? "p-0" : undefined}>
        <CardHeader className={cn("pb-2", compact && "px-3 pt-3 pb-1")}>
          <h2 className={cn("font-rs-bold text-primary", compact ? "text-base" : "text-xl")}>
            {boss.display_name}
          </h2>
        </CardHeader>
        <CardContent className={cn("pt-0", compact && "px-3 pb-2")}>
          <div className="w-full text-sm">
            <RankHeader valueLabel="KC" compact={compact} />
            {displayed.map((entry, i) => (
              <RankRow
                key={entry.player_name}
                rank={swappedRank !== null && i === displayed.length - 1 ? swappedRank : i + 1}
                name={entry.player_name}
                compact={compact}
                highlight={!!exactMatch && entry.player_name.toLowerCase() === exactMatch}
                value={
                  <Badge
                    variant="secondary"
                    className={cn("font-rs-bold tabular-nums", compact ? "text-xs px-1.5 py-0" : "text-xs")}
                  >
                    {entry.kills.toLocaleString()}
                  </Badge>
                }
              />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => setSheetOpen(true)}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border pt-2 text-center mt-2"
            >
              View all {boss.entries.length} records
            </button>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
            <SheetTitle className="font-rs-bold text-primary text-lg leading-tight">{boss.display_name}</SheetTitle>
            <p className="text-xs text-muted-foreground">{boss.entries.length.toLocaleString()} records</p>
          </SheetHeader>
          <KcSheetList entries={boss.entries} />
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Tab: Killcounts ────────────────────────────────────────────────────────────

function KcLeaderboardTab({ compact }: { compact: boolean }) {
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data: bosses = [], isLoading } = useKillcountLeaderboard();

  if (isLoading) return <LeaderboardSkeleton />;

  // All entries across all bosses for count computation
  const allEntries = (bosses as KcBoss[]).flatMap((b) => b.entries);
  const counts = gemRankCounts(allEntries);

  const filteredBosses = (bosses as KcBoss[])
    .map((boss) => ({
      ...boss,
      entries: rankFilter ? boss.entries.filter((e) => resolveFilterRank(e) === rankFilter) : boss.entries,
    }))
    .filter((boss) => boss.entries.length > 0);

  const q = search.trim().toLowerCase();
  const visibleBosses = q
    ? filteredBosses.filter(
        (boss) =>
          boss.display_name.toLowerCase().includes(q) ||
          boss.entries.some((e) => e.player_name.toLowerCase().includes(q)),
      )
    : filteredBosses;

  const cols = compact ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-1 md:grid-cols-3";

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} placeholder="Search boss or player..." />
      <RankFilterPills active={rankFilter} onChange={setRankFilter} compact={compact} counts={counts} />
      {visibleBosses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No killcount data matches this filter.</p>
      ) : (
        <div className={cn("grid gap-4", cols)}>
          {visibleBosses.map((boss) => (
            <KcBossCard key={boss.metric} boss={boss} compact={compact} exactMatch={q || undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Collection Log ────────────────────────────────────────────────────────

function ClogLeaderboardTab({ compact }: { compact: boolean }) {
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const { data: entries = [], isLoading } = useClogLeaderboard();

  if (isLoading) return <LeaderboardListSkeleton compact={compact} />;

  const counts = gemRankCounts(entries as ClogEntry[]);
  const filtered = rankFilter
    ? (entries as ClogEntry[]).filter((e) => resolveFilterRank(e) === rankFilter)
    : (entries as ClogEntry[]);

  return (
    <div className="space-y-4">
      <RankFilterPills active={rankFilter} onChange={setRankFilter} compact={compact} counts={counts} />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No collection log data matches this filter.</p>
      ) : (
        <Card>
          <CardContent className={cn("pt-4", compact && "pt-2 pb-2")}>
            <div className="w-full text-sm">
              <RankHeader valueLabel="Slots" compact={compact} />
              {filtered.map((entry, i) => (
                <RankRow
                  key={entry.player_name}
                  rank={i + 1}
                  name={entry.player_name}
                  compact={compact}
                  value={
                    <Badge
                      variant="secondary"
                      className={cn("font-rs-bold tabular-nums", compact ? "text-xs px-1.5 py-0" : "text-xs")}
                    >
                      {entry.slots.toLocaleString()}
                      {entry.slots_max > 0 && (
                        <span className="ml-1 text-muted-foreground font-normal">
                          / {entry.slots_max.toLocaleString()}
                        </span>
                      )}
                    </Badge>
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Tab: Cluescrolls ───────────────────────────────────────────────────────────

function LeaguesLeaderboardTab({ compact }: { compact: boolean }) {
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const { data: entries = [], isLoading } = useLeagueLeaderboard();

  if (isLoading) return <LeaderboardListSkeleton compact={compact} />;

  const counts = gemRankCounts(entries as LeaguesEntry[]);
  const filtered = rankFilter
    ? (entries as LeaguesEntry[]).filter((e) => resolveFilterRank(e) === rankFilter)
    : (entries as LeaguesEntry[]);

  return (
    <div className="space-y-4">
      <RankFilterPills active={rankFilter} onChange={setRankFilter} compact={compact} counts={counts} />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cluescroll data matches this filter.</p>
      ) : (
        <Card>
          <CardContent className={cn("pt-4", compact && "pt-2 pb-2")}>
            <div className="w-full text-sm">
              <RankHeader valueLabel="Clues" compact={compact} />
              {filtered.map((entry, i) => (
                <RankRow
                  key={entry.player_name}
                  rank={i + 1}
                  name={entry.player_name}
                  compact={compact}
                  value={
                    <Badge
                      variant="secondary"
                      className={cn("font-rs-bold tabular-nums", compact ? "text-xs px-1.5 py-0" : "text-xs")}
                    >
                      {entry.score.toLocaleString()}
                    </Badge>
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Tab: Ranking ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

function RankingLeaderboardTab({ compact }: { compact: boolean }) {
  const [page, setPage] = useState(0);
  const [womRankFilter, setWomRankFilter] = useState<string | null>(null);
  const [clanRankFilter, setClanRankFilter] = useState<string | null>(null);

  const { data, isLoading } = useRankingResults(
    page * PAGE_SIZE,
    PAGE_SIZE,
    womRankFilter ?? undefined,
  );
  const { data: stats } = useRankingStats();

  const players = data?.players ?? [];

  const visiblePlayers = clanRankFilter
    ? players.filter((p) => p.clan_rank === clanRankFilter)
    : players;

  const distTotal = stats
    ? Object.values(stats.rank_distribution).reduce((s, n) => s + n, 0)
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats + rank distribution */}
      {stats && (() => {
        const womPieData = ALL_WOM_RANKS
          .map((r) => ({ name: r, value: stats.rank_distribution[r] ?? 0 }))
          .filter((d) => d.value > 0);
        const GEM_RANK_ORDER = ["Zenyte", "Onyx", "Dragonstone", "Diamond", "Ruby", "Emerald", "Sapphire", "Achiever", "Guest"];
        const clanPieData = GEM_RANK_ORDER
          .map((r) => ({ name: r, value: stats.clan_rank_distribution[r] ?? 0 }))
          .filter((d) => d.value > 0);
        const chartSize = compact ? 130 : 160;

        const PieBlock = ({
          data,
          hexMap,
          colorMap,
          label,
        }: {
          data: { name: string; value: number }[];
          hexMap: Record<string, string>;
          colorMap: Record<string, string>;
          label: string;
        }) => {
          const total = data.reduce((s, d) => s + d.value, 0);
          const pct = (v: number) => total > 0 ? `${Math.round((v / total) * 100)}%` : "0%";
          return (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-1 gap-y-0.5">
                  {data.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 min-w-[110px]">
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ background: hexMap[d.name] ?? "#334155" }}
                      />
                      <span className={cn("text-xs", colorMap[d.name])}>{d.name}</span>
                      <span className="ml-auto tabular-nums text-xs text-muted-foreground pl-1">{pct(d.value)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ width: chartSize, height: chartSize, flexShrink: 0 }}>
                  <PieChart width={chartSize} height={chartSize}>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={compact ? 35 : 44}
                      outerRadius={compact ? 58 : 74}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {data.map((entry) => (
                        <Cell key={entry.name} fill={hexMap[entry.name] ?? "#334155"} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]!;
                        return (
                          <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-md">
                            <span className={cn("font-medium", colorMap[d.name as string])}>{d.name}</span>
                            <span className="ml-2 tabular-nums text-muted-foreground">{pct(d.value as number)}</span>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </div>
              </div>
            </div>
          );
        };

        const presentClanRanks = GEM_RANK_ORDER.filter((cr) =>
          ALL_WOM_RANKS.some((wr) => (stats.rank_overlap[wr]?.[cr] ?? 0) > 0)
        );
        const barData = ALL_WOM_RANKS.map((wr) => {
          const bucket = stats.rank_overlap[wr] ?? {};
          const total = Object.values(bucket).reduce((s, n) => s + n, 0);
          const entry: Record<string, string | number> = { rank: wr };
          for (const cr of presentClanRanks) {
            entry[cr] = total > 0 ? Math.round(((bucket[cr] ?? 0) / total) * 100) : 0;
          }
          return entry;
        });
        const barHeight = compact ? 160 : 200;

        return (
          <div className="flex flex-col sm:flex-row items-stretch gap-4 rounded-lg border border-border bg-card p-4">
            {/* Left: PvM / Skilling boxes */}
            <div className="flex sm:flex-col justify-center gap-3 shrink-0">
              <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-center flex-1 sm:flex-none">
                <p className="text-xs text-muted-foreground mb-1">PvM contribution</p>
                <p className={cn("font-bold text-foreground", compact ? "text-xl" : "text-2xl")}>
                  {stats.avg_boss_pct}%
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-center flex-1 sm:flex-none">
                <p className="text-xs text-muted-foreground mb-1">Skilling contribution</p>
                <p className={cn("font-bold text-foreground", compact ? "text-xl" : "text-2xl")}>
                  {stats.avg_skill_pct}%
                </p>
              </div>
            </div>

            <div className="hidden sm:block w-px bg-border self-stretch" />

            {/* Pie charts */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <PieBlock data={clanPieData} hexMap={GEM_RANK_HEX} colorMap={GEM_RANK_COLOR} label="Clan Rank" />
              <div className="hidden sm:block w-px bg-border self-stretch" />
              <PieBlock data={womPieData} hexMap={WOM_RANK_HEX} colorMap={WOM_RANK_COLOR} label="WOM Rank" />
            </div>

            <div className="hidden sm:block w-px bg-border self-stretch" />

            {/* Overlap stacked bar */}
            <div className="flex flex-col justify-center gap-1 min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Rank Overlap</p>
              <ResponsiveContainer width="100%" height={barHeight}>
              <BarChart data={barData} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                <XAxis dataKey="rank" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v.replace("No Rank", "None").replace("Rank ", "R")} />
                <YAxis unit="%" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 50, 100]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md space-y-0.5">
                        <p className={cn("font-medium mb-1", WOM_RANK_COLOR[label as string])}>{label}</p>
                        {[...payload].reverse().map((p) => (
                          <div key={p.dataKey as string} className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: p.fill }} />
                            <span className={cn(GEM_RANK_COLOR[p.dataKey as string])}>{p.dataKey}</span>
                            <span className="ml-auto tabular-nums text-muted-foreground pl-3">{p.value}%</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                {presentClanRanks.map((cr) => (
                  <Bar key={cr} dataKey={cr} stackId="a" fill={GEM_RANK_HEX[cr] ?? "#334155"} />
                ))}
              </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      {/* WOM rank distribution bar - all ranks always present */}
      {stats && (
        <div className="flex h-2 rounded-full overflow-hidden">
          {ALL_WOM_RANKS.map((r) => {
            const count = stats.rank_distribution[r] ?? 0;
            const pct = distTotal > 0 ? (count / distTotal) * 100 : 0;
            return (
              <div
                key={r}
                className={WOM_RANK_BAR_COLOR[r]}
                style={{ width: `${pct}%` }}
                title={`${r}: ${count}`}
              />
            );
          })}
        </div>
      )}

      {/* WOM rank filter pills - counts always from full dataset */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-muted-foreground shrink-0">WOM rank:</span>
        <button
          onClick={() => { setWomRankFilter(null); setPage(0); }}
          className={cn(
            "rounded-full px-3 py-0.5 text-xs font-medium transition-colors border",
            compact && "px-2 py-px",
            !womRankFilter
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary",
          )}
        >
          All ({distTotal})
        </button>
        {ALL_WOM_RANKS.map((r) => (
          <button
            key={r}
            onClick={() => { setWomRankFilter(r); setPage(0); }}
            className={cn(
              "rounded-full px-3 py-0.5 text-xs font-medium transition-colors border",
              compact && "px-2 py-px",
              womRankFilter === r
                ? "border-primary bg-primary text-primary-foreground"
                : cn("border-border hover:border-primary", WOM_RANK_COLOR[r]),
            )}
          >
            {r} ({stats?.rank_distribution[r] ?? 0})
          </button>
        ))}
      </div>

      {/* Clan rank filter pills - counts from full dataset via backend */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-muted-foreground shrink-0">Clan rank:</span>
        <RankFilterPills
          active={clanRankFilter}
          onChange={setClanRankFilter}
          compact={compact}
          counts={stats?.clan_rank_distribution}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <RankingTabSkeleton compact={compact} />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">RSN</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Clan rank</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">WOM rank</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Points</th>
                {!compact && (
                  <>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">PvM pts</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Skill pts</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visiblePlayers.map((p, i) => {
                const totalPts = p.boss_points + p.skill_points;
                const bossPct = totalPts > 0 ? Math.round((p.boss_points / totalPts) * 100) : 0;
                return (
                  <tr key={p.rsn} className="hover:bg-muted/30 transition-colors">
                    <td className={cn("px-3 py-2 text-muted-foreground tabular-nums", compact && "py-1")}>
                      {page * PAGE_SIZE + i + 1}
                    </td>
                    <td className={cn("px-3 py-2 font-mono font-medium", compact && "py-1 text-xs")}>{p.rsn}</td>
                    <td className={cn("px-3 py-2", compact && "py-1", GEM_RANK_COLOR[p.clan_rank ?? ""] ?? "text-muted-foreground")}>
                      <span className="text-xs">{p.clan_rank ?? "-"}</span>
                    </td>
                    <td className={cn("px-3 py-2", compact && "py-1", WOM_RANK_COLOR[p.rank] ?? "text-muted-foreground")}>
                      <span className="text-xs">{p.rank}</span>
                    </td>
                    <td className={cn("px-3 py-2 text-right tabular-nums", compact && "py-1 text-xs")}>
                      {fmtNum(p.points)}
                    </td>
                    {!compact && (
                      <>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground text-xs">
                          {fmtNum(p.boss_points)}
                          <span className="ml-1 text-muted-foreground/60">({bossPct}%)</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground text-xs">
                          {fmtNum(p.skill_points)}
                          <span className="ml-1 text-muted-foreground/60">({100 - bossPct}%)</span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visiblePlayers.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No players match this filter.</p>
          )}
        </div>
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center gap-2 justify-center text-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-muted-foreground">
            Page {page + 1} of {Math.ceil(data.total / PAGE_SIZE)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * PAGE_SIZE >= data.total}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function LeaderboardsPage() {
  const [tab, setTab] = useState<LeaderboardTab>("pb");
  const [density, setDensity] = useState<Density>("comfortable");
  const compact = density === "compact";

  return (
    <div className="mx-auto max-w-7xl w-full space-y-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-rs-bold text-4xl text-primary">Leaderboards</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDensity((d) => (d === "comfortable" ? "compact" : "comfortable"))}
          title={compact ? "Switch to comfortable view" : "Switch to compact view"}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          {compact ? <LayoutGrid className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
          <span className="text-xs">{compact ? "Comfortable" : "Compact"}</span>
        </Button>
      </div>

      {/* Tab switcher */}
      <ToggleGroup
        type="single"
        variant="outline"
        value={tab}
        onValueChange={(v) => { if (v) setTab(v as LeaderboardTab); }}
        className="flex-wrap justify-start"
      >
        <ToggleGroupItem value="pb">Personal Bests</ToggleGroupItem>
        <ToggleGroupItem value="clog">Collection Logs</ToggleGroupItem>
        <ToggleGroupItem value="kc">Killcounts</ToggleGroupItem>
        <ToggleGroupItem value="leagues">Cluescrolls</ToggleGroupItem>
        <ToggleGroupItem value="ranking">Ranking</ToggleGroupItem>
      </ToggleGroup>

      <Separator />

      {/* Tab content - min-h prevents footer jump during loading */}
      <div key={tab} className="animate-in fade-in-0 duration-300 min-h-[60vh]">
        {tab === "pb"      && <PbLeaderboardTab compact={compact} />}
        {tab === "clog"    && <ClogLeaderboardTab compact={compact} />}
        {tab === "kc"      && <KcLeaderboardTab compact={compact} />}
        {tab === "leagues" && <LeaguesLeaderboardTab compact={compact} />}
        {tab === "ranking" && <RankingLeaderboardTab compact={compact} />}
      </div>
    </div>
  );
}
