import { cn } from "@/lib/utils";
import { useOwnRsns } from "@/hooks/useOwnRsns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GEM_RANK_DOT_COLOR } from "@/lib/leaderboardRanks";
import { AccountHoverCard } from "@/components/accounts/accountHoverCard";

export function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const wholeSec = Math.floor(s % 60);
  const cs = Math.round((s % 1) * 100);
  const secStr = `${String(wholeSec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${secStr}`;
  return `${m}:${secStr}`;
}

export function rankLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export function fmtNum(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString();
}

// Every column is either a fixed width or `1fr` (name), and every column's
// content is `truncate`/`overflow-hidden`, so no column's content can ever
// force its track wider than assigned. That's what keeps CC Rank and Value
// pinned to the same x-position on every row regardless of name length -
// a track that could grow with its content would push everything after it.
// Value was narrowed vs. the original so name (1fr) gets more room before
// it needs to ellipsize.
const GRID_4 = {
  comfortable: "grid-cols-[2rem_1fr_5rem_4rem]",
  compact:     "grid-cols-[1.5rem_1fr_auto_auto]",
} as const;

// wideCcRank opts into a wider, text-based CC Rank column (cluescrolls only
// - its page grid gives cards enough room). Default KC/PB stay narrower with
// a colored dot in compact mode instead of the full rank name.
const GRID_4_WIDE_CC = {
  comfortable: "grid-cols-[2rem_1fr_6rem_4rem]",
  compact:     "grid-cols-[1.5rem_1fr_6rem_auto]",
} as const;

const GRID_3 = {
  comfortable: "grid-cols-[2rem_1fr_auto]",
  compact:     "grid-cols-[1.5rem_1fr_auto]",
} as const;

export function RankRow({
  rank,
  name,
  value,
  compact,
  highlight,
  gemRankText,
  gemRankClass,
  showRankCol = false,
  wideCcRank = false,
}: {
  rank: number;
  name: string;
  value: React.ReactNode;
  compact: boolean;
  highlight?: boolean;
  gemRankText?: string;
  gemRankClass?: string;
  showRankCol?: boolean;
  wideCcRank?: boolean;
}): React.ReactElement {
  const ownRsns = useOwnRsns();
  const isOwn = ownRsns.has(name.toLowerCase());
  const fourCol = showRankCol || !!gemRankText;
  const mode = compact ? "compact" : "comfortable";
  const grid4 = wideCcRank ? GRID_4_WIDE_CC : GRID_4;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "grid gap-x-3 items-center border-b border-border last:border-0 hover:bg-muted/40 rounded-sm cursor-default",
            fourCol ? grid4[mode] : GRID_3[mode],
            compact ? "py-0.5" : "py-1.5",
            highlight && "ring-1 ring-primary/60 bg-primary/5 rounded-sm px-1 -mx-1",
          )}
        >
          <span className="text-xs text-muted-foreground">{rankLabel(rank)}</span>
          <AccountHoverCard rsn={name} className={cn("font-medium text-foreground truncate", compact && "text-xs", isOwn && "own-rsn")}>{name}</AccountHoverCard>
          {fourCol && (
            compact && !wideCcRank
              ? <span className={cn("inline-block h-2 w-2 rounded-full shrink-0 self-center", gemRankText ? GEM_RANK_DOT_COLOR[gemRankText] : "opacity-0")} />
              : <span className={cn("text-xs truncate self-center", gemRankClass)}>{gemRankText ?? ""}</span>
          )}
          <div className={cn(compact ? "" : "flex items-center justify-end overflow-hidden")}>{value}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="flex flex-col gap-1">
        <p className="font-medium">{name}</p>
        <div className="flex items-center gap-2 text-muted-foreground">
          {gemRankText && <span className={cn("text-xs", gemRankClass)}>{gemRankText}</span>}
          <span className="text-xs">{rankLabel(rank)}</span>
          <div className="[&_*]:!text-xs [&_*]:!px-1.5 [&_*]:!py-0">{value}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function RankHeader({
  compact = false,
  showRank = false,
  wideCcRank = false,
}: {
  compact?: boolean;
  showRank?: boolean;
  wideCcRank?: boolean;
}): React.ReactElement {
  const mode = compact ? "compact" : "comfortable";
  const grid4 = wideCcRank ? GRID_4_WIDE_CC : GRID_4;
  return (
    <div
      className={cn(
        "gap-x-3 border-b border-border pb-1 text-xs text-muted-foreground",
        showRank ? `grid ${grid4[mode]}` : `grid ${GRID_3[mode]}`,
      )}
    >
      <span>Rank</span>
      <span>Player</span>
      {showRank && (compact && !wideCcRank ? <span className="inline-block h-2 w-2" /> : <span className="truncate">CC Rank</span>)}
      <div />
    </div>
  );
}
