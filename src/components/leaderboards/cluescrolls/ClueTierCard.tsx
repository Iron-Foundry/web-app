import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { RankRow, RankHeader } from "@/components/leaderboards/RankRow";
import { SheetRankList } from "@/components/leaderboards/SheetRankList";
import { resolveFilterRank, GEM_RANK_COLOR } from "@/lib/leaderboardRanks";
import type { ClueTier } from "@/types/leaderboard";

const CLUE_CLAMP = 10;

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
      <div className="rounded-xl border border-border bg-card">
        <div title={tier.display_name} className={cn("font-rs-bold text-primary truncate", compact ? "px-2 pt-1.5 pb-0.5 text-sm" : "px-3 pt-2.5 pb-1 text-base")}>
          {tier.display_name}
        </div>
        <div className={compact ? "px-2 pb-1.5" : "px-3 pb-2.5"}>
          <div className="w-full text-sm">
            <RankHeader compact={compact} showRank wideCcRank />
            {displayed.map((entry, i) => {
              const gemRank = resolveFilterRank(entry);
              return (
                <RankRow
                  key={entry.player_name}
                  rank={swappedRank !== null && i === displayed.length - 1 ? swappedRank : i + 1}
                  name={entry.player_name}
                  compact={compact}
                  showRankCol
                  wideCcRank
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
                  compact ? "grid grid-cols-[1.5rem_1fr_6rem_auto] gap-x-3 items-center border-b border-border" : "grid grid-cols-[2rem_1fr_6rem_4rem] gap-x-3 items-center border-b border-border",
                  compact ? "py-0.5" : "py-1.5",
                )}
              >
                <span className="text-xs text-muted-foreground/25">-</span>
                <span className="text-xs text-muted-foreground/25">-</span>
                <span className="text-xs invisible truncate self-center">Dragonstone</span>
                <div className="flex items-center justify-end overflow-hidden">
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
          <SheetRankList valueLabel="Score" valueOf={(e) => e.score} entries={tier.entries} />
        </SheetContent>
      </Sheet>
    </>
  );
}
