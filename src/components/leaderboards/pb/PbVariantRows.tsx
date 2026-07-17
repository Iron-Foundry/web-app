import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RankRow, RankHeader, formatTime } from "@/components/leaderboards/RankRow";
import { resolveFilterRank, GEM_RANK_COLOR } from "@/lib/leaderboardRanks";
import type { PbEntry } from "@/types/leaderboard";

export const PB_CLAMP = 6;

function EmptyRankRow({ compact }: { compact: boolean }): React.ReactElement {
  return (
    <div
      className={cn(
        compact ? "grid grid-cols-[1.5rem_1fr_auto_auto] gap-x-3 items-center border-b border-border" : "grid grid-cols-[2rem_1fr_5rem_4rem] gap-x-3 items-center border-b border-border",
        compact ? "py-0.5" : "py-1.5",
      )}
    >
      <span className="text-xs text-muted-foreground/25">-</span>
      <span className="text-xs text-muted-foreground/25">-</span>
      <span className="text-xs invisible truncate self-center">Dragonstone</span>
      <div className="flex items-center justify-end overflow-hidden">
        <Badge variant="secondary" className={cn("font-rs-bold tabular-nums invisible", compact ? "text-xs px-1.5 py-0" : "text-xs")}>
          0:00.00
        </Badge>
      </div>
    </div>
  );
}

export function PbVariantRows({
  variantMap,
  clamp,
  compact,
  exactMatch,
}: {
  variantMap: Record<string, PbEntry[]>;
  clamp: boolean;
  compact: boolean;
  exactMatch?: string;
}): React.ReactElement {
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

        const bufferCount = clamp ? Math.max(0, PB_CLAMP - rows.length) : 0;

        return (
          <div key={variant} className={compact ? "space-y-0" : "space-y-1"}>
            {variant && (
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {variant}
              </p>
            )}
            <div className="w-full text-sm">
              <RankHeader compact={compact} showRank />
              {rows.map((entry, i) => {
                const gemRank = resolveFilterRank(entry);
                return (
                  <RankRow
                    key={entry.player_name}
                    rank={swappedRank !== null && i === rows.length - 1 ? swappedRank : i + 1}
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
                        {formatTime(entry.time_seconds)}
                      </Badge>
                    }
                  />
                );
              })}
              {Array.from({ length: bufferCount }).map((_, i) => (
                <EmptyRankRow key={`empty-${i}`} compact={compact} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
