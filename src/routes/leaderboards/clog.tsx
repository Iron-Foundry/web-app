import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { leaderboardsRoute } from "@/routes/leaderboards";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeaderboardListSkeleton } from "@/components/skeletons/LeaderboardSkeleton";
import { FilterToolbar } from "@/components/leaderboards/FilterToolbar";
import { RankRow, RankHeader } from "@/components/leaderboards/RankRow";
import { useLeaderboardContext } from "@/components/leaderboards/LeaderboardContext";
import { useClogLeaderboard } from "@/hooks/useLeaderboards";
import { resolveFilterRank, gemRankCounts } from "@/lib/leaderboardRanks";
import type { ClogEntry } from "@/types/leaderboard";

export const leaderboardsClogRoute = createRoute({
  getParentRoute: () => leaderboardsRoute,
  path: "clog",
  component: ClogLeaderboardTab,
});

function ClogLeaderboardTab(): React.ReactElement {
  const { compact, setDensity, density } = useLeaderboardContext();
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const { data: entries = [], isLoading } = useClogLeaderboard();

  if (isLoading) return <LeaderboardListSkeleton compact={compact} />;

  const counts = gemRankCounts(entries as ClogEntry[]);
  const filtered = rankFilter
    ? (entries as ClogEntry[]).filter((e) => resolveFilterRank(e) === rankFilter)
    : (entries as ClogEntry[]);

  return (
    <div className="space-y-4">
      <FilterToolbar
        search=""
        onSearchChange={() => {}}
        rankFilter={rankFilter}
        onRankFilterChange={setRankFilter}
        compact={compact}
        onCompactToggle={() => setDensity(density === "comfortable" ? "compact" : "comfortable")}
        rankCounts={counts}
        showSearch={false}
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No collection log data matches this filter.</p>
      ) : (
        <Card>
          <CardContent className={cn("pt-4", compact && "pt-2 pb-2")}>
            <div className="w-full text-sm">
              <RankHeader />
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
