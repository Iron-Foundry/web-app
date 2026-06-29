import { cn } from "@/lib/utils";
import { useOwnRsns } from "@/hooks/useOwnRsns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GEM_RANK_DOT_COLOR } from "@/lib/leaderboardRanks";

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

const GRID_4 = {
  comfortable: "grid-cols-[2rem_1fr_5rem_5rem]",
  compact:     "grid-cols-[1.5rem_1fr_auto_auto]",
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
}: {
  rank: number;
  name: string;
  value: React.ReactNode;
  compact: boolean;
  highlight?: boolean;
  gemRankText?: string;
  gemRankClass?: string;
  showRankCol?: boolean;
}): React.ReactElement {
  const ownRsns = useOwnRsns();
  const isOwn = ownRsns.has(name.toLowerCase());
  const fourCol = showRankCol || !!gemRankText;
  const mode = compact ? "compact" : "comfortable";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "grid gap-x-3 items-center border-b border-border last:border-0 hover:bg-muted/40 rounded-sm cursor-default",
            fourCol ? GRID_4[mode] : GRID_3[mode],
            compact ? "py-0.5" : "py-1.5",
            highlight && "ring-1 ring-primary/60 bg-primary/5 rounded-sm px-1 -mx-1",
          )}
        >
          <span className="text-xs text-muted-foreground">{rankLabel(rank)}</span>
          <span className={cn("font-medium text-foreground truncate", compact && "text-xs", isOwn && "own-rsn")}>{name}</span>
          {fourCol && (
            compact
              ? <span className={cn("inline-block h-2 w-2 rounded-full shrink-0 self-center", gemRankText ? GEM_RANK_DOT_COLOR[gemRankText] : "opacity-0")} />
              : <span className={cn("text-xs shrink-0", gemRankClass)}>{gemRankText ?? ""}</span>
          )}
          <div className={cn(compact ? "" : "flex justify-end")}>{value}</div>
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
}: {
  compact?: boolean;
  showRank?: boolean;
}): React.ReactElement {
  const mode = compact ? "compact" : "comfortable";
  return (
    <div
      className={cn(
        "gap-x-3 border-b border-border pb-1 text-xs text-muted-foreground",
        showRank ? `grid ${GRID_4[mode]}` : `grid ${GRID_3[mode]}`,
      )}
    >
      <span>Rank</span>
      <span>Player</span>
      {showRank && (compact ? <span className="inline-block h-2 w-2" /> : <span>CC Rank</span>)}
      <div />
    </div>
  );
}
