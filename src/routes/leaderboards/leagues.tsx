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
import { useLeagueLeaderboard } from "@/hooks/useLeaderboards";
import { resolveFilterRank, gemRankCounts } from "@/lib/leaderboardRanks";
import type { LeaguesEntry } from "@/types/leaderboard";

export const leaderboardsLeaguesRoute = createRoute({
  getParentRoute: () => leaderboardsRoute,
  path: "leagues",
  component: LeaguesLeaderboardTab,
});

function LeaguesLeaderboardTab(): React.ReactElement {
  const { compact, setDensity, density } = useLeaderboardContext();
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const { data: entries = [], isLoading } = useLeagueLeaderboard();

  if (isLoading) return <LeaderboardListSkeleton compact={compact} />;

  const counts = gemRankCounts(entries as LeaguesEntry[]);
  const filtered = rankFilter
    ? (entries as LeaguesEntry[]).filter((e) => resolveFilterRank(e) === rankFilter)
    : (entries as LeaguesEntry[]);

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
        <p className="text-sm text-muted-foreground">No cluescroll data matches this filter.</p>
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
