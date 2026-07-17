import { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { RankRow, RankHeader, rankLabel } from "@/components/leaderboards/RankRow";
import { resolveFilterRank, GEM_RANK_COLOR } from "@/lib/leaderboardRanks";
import { AccountHoverCard } from "@/components/accounts/accountHoverCard";
import type { ClueTier } from "@/types/leaderboard";

const CLUE_CLAMP = 10;

type ClueEntry = ClueTier["entries"][number];

function ClueSheetList({ entries }: { entries: ClueEntry[] }): React.ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: entries.length + 1,
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
              <div className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-x-4 border-b border-border pb-1 text-xs text-muted-foreground">
                <span>Rank</span><span>Player</span><span>CC Rank</span><div className="flex justify-end">Score</div>
              </div>
            ) : (
              (() => {
                const entry = entries[vItem.index - 1]!;
                const gemRank = resolveFilterRank(entry);
                return (
                  <div className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-x-4 items-center border-b border-border last:border-0 hover:bg-muted/40 rounded-sm py-1.5">
                    <span className="text-xs text-muted-foreground">{rankLabel(vItem.index)}</span>
                    <AccountHoverCard rsn={entry.player_name} className="font-medium text-foreground truncate">{entry.player_name}</AccountHoverCard>
                    <span className={cn("text-xs shrink-0", gemRank ? GEM_RANK_COLOR[gemRank] : "text-muted-foreground/30")}>
                      {gemRank ?? "-"}
                    </span>
                    <div className="flex justify-end">
                      <Badge variant="secondary" className="font-rs-bold tabular-nums text-xs">
                        {entry.score.toLocaleString()}
                      </Badge>
                    </div>
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

export function ClueTierCard({ tier, compact, exactMatch }: { tier: ClueTier; compact: boolean; exactMatch?: string }): React.ReactElement {
  const [sheetOpen, setSheetOpen] = useState(false);

  let displayed = tier.entries.slice(0, CLUE_CLAMP);
  let swappedRank: number | null = null;

  if (exactMatch) {
    const matchIdx = tier.entries.findIndex((e) => e.player_name.toLowerCase() === exactMatch);
    if (matchIdx >= CLUE_CLAMP) {
      displayed = [...tier.entries.slice(0, CLUE_CLAMP - 1), tier.entries[matchIdx]!];
      swappedRank = matchIdx + 1;
    }
  }

  return (
    <>
      <div className="rounded-md border border-border bg-card">
        <div title={tier.display_name} className={cn("font-rs-bold text-primary truncate", compact ? "px-2 pt-1.5 pb-0.5 text-sm" : "px-3 pt-2.5 pb-1 text-base")}>
          {tier.display_name}
        </div>
        <div className={compact ? "px-2 pb-1.5" : "px-3 pb-2.5"}>
          <div className="w-full text-sm">
            <RankHeader compact={compact} showRank />
            {displayed.map((entry, i) => {
              const gemRank = resolveFilterRank(entry);
              return (
                <RankRow
                  key={entry.player_name}
                  rank={swappedRank !== null && i === displayed.length - 1 ? swappedRank : i + 1}
                  name={entry.player_name}
                  compact={compact}
                  showRankCol
                  highlight={!!exactMatch && entry.player_name.toLowerCase() === exactMatch}
                  gemRankText={gemRank ?? undefined}
                  gemRankClass={gemRank ? GEM_RANK_COLOR[gemRank] : undefined}
                  value={
                    <Badge
                      variant="secondary"
                      className={cn("font-rs-bold tabular-nums", compact ? "text-xs px-1.5 py-0" : "text-xs")}
                    >
                      {entry.score.toLocaleString()}
                    </Badge>
                  }
                />
              );
            })}
            {Array.from({ length: Math.max(0, CLUE_CLAMP - displayed.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className={cn(
                  compact ? "grid grid-cols-[1.5rem_1fr_auto_auto] gap-x-3 items-center border-b border-border" : "grid grid-cols-[2rem_1fr_5rem_5rem] gap-x-3 items-center border-b border-border",
                  compact ? "py-0.5" : "py-1.5",
                )}
              >
                <span className="text-xs text-muted-foreground/25">-</span>
                <span className="text-xs text-muted-foreground/25">-</span>
                <span className="text-xs invisible">Dragonstone</span>
                <div className="flex justify-end">
                  <Badge variant="secondary" className={cn("font-rs-bold tabular-nums invisible", compact ? "text-xs px-1.5 py-0" : "text-xs")}>
                    10,000
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {tier.entries.length > CLUE_CLAMP && (
            <button
              onClick={() => setSheetOpen(true)}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border pt-1.5 text-center mt-1"
            >
              View all {tier.entries.length} records
            </button>
          )}
        </div>
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
            <SheetTitle className="font-rs-bold text-primary text-lg leading-tight">{tier.display_name}</SheetTitle>
            <p className="text-xs text-muted-foreground">{tier.entries.length.toLocaleString()} records</p>
          </SheetHeader>
          <ClueSheetList entries={tier.entries} />
        </SheetContent>
      </Sheet>
    </>
  );
}
