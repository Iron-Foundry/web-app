import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { rankLabel } from "@/components/leaderboards/RankRow";
import { resolveFilterRank, GEM_RANK_COLOR } from "@/lib/leaderboardRanks";
import { AccountHoverCard } from "@/components/accounts/accountHoverCard";

interface RankedEntry {
  player_name: string;
  clan_rank?: string | null;
  discord_rank?: string | null;
}

interface Props<T extends RankedEntry> {
  entries: T[];
  valueLabel: string;
  valueOf: (entry: T) => number;
}

const ROW = "grid grid-cols-rank-sheet gap-x-4";

/** Every record of a board in a virtual list: rank, player, CC rank and the board's value. */
export function SheetRankList<T extends RankedEntry>({ entries, valueLabel, valueOf }: Props<T>): React.ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: entries.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (i === 0 ? 28 : 37),
    overscan: 20,
  });

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto px-6">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const entry = vItem.index === 0 ? null : entries[vItem.index - 1]!;
          const gemRank = entry ? resolveFilterRank(entry) : null;
          return (
            <div
              key={vItem.key}
              data-index={vItem.index}
              ref={virtualizer.measureElement}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vItem.start}px)` }}
            >
              {entry === null ? (
                <div className={cn(ROW, "border-b border-border pb-1 text-xs text-muted-foreground")}>
                  <span>Rank</span><span>Player</span><span>CC Rank</span><div className="flex justify-end">{valueLabel}</div>
                </div>
              ) : (
                <div className={cn(ROW, "items-center rounded-sm border-b border-border py-1.5 last:border-0 hover:bg-muted/40")}>
                  <span className="text-xs text-muted-foreground">{rankLabel(vItem.index)}</span>
                  <AccountHoverCard rsn={entry.player_name} className="truncate font-medium text-foreground">{entry.player_name}</AccountHoverCard>
                  <span className={cn("shrink-0 text-xs", gemRank ? GEM_RANK_COLOR[gemRank] : "text-muted-foreground/30")}>{gemRank ?? "-"}</span>
                  <div className="flex justify-end">
                    <Badge variant="secondary" className="font-rs-bold text-xs tabular-nums">{valueOf(entry).toLocaleString()}</Badge>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
