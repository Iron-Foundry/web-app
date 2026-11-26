import { useState } from "react";
import { RankingTable } from "@/components/leaderboards/ranking/RankingTable";
import { createRoute } from "@tanstack/react-router";
import { leaderboardsRoute } from "@/routes/leaderboards";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RankingTabSkeleton } from "@/components/skeletons/LeaderboardSkeleton";
import { FilterToolbar } from "@/components/leaderboards/FilterToolbar";
import { RankFilterPills } from "@/components/leaderboards/RankFilterPills";
import { RankingStats } from "@/components/leaderboards/ranking/RankingStats";
import { RankingPlayerSheet } from "@/components/leaderboards/ranking/RankingPlayerSheet";
import { useLeaderboardContext } from "@/components/leaderboards/LeaderboardContext";
import { useRankingResults, useRankingStats } from "@/hooks/useLeaderboards";
import { useOwnRsns } from "@/hooks/useOwnRsns";
import { ALL_WOM_RANKS, WOM_RANK_COLOR, WOM_RANK_BAR_COLOR } from "@/lib/leaderboardRanks";
import type { RankingPlayer } from "@/types/leaderboard";

const PAGE_SIZE = 50;

export const leaderboardsRankingRoute = createRoute({
  getParentRoute: () => leaderboardsRoute,
  path: "ranking",
  component: RankingLeaderboardTab,
});

function RankingLeaderboardTab(): React.ReactElement {
  const { compact, setDensity, density } = useLeaderboardContext();
  const [page, setPage] = useState(0);
  const [womRankFilter, setWomRankFilter] = useState<string | null>(null);
  const [clanRankFilter, setClanRankFilter] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<RankingPlayer | null>(null);
  const ownRsns = useOwnRsns();

  const { data, isLoading } = useRankingResults(page * PAGE_SIZE, PAGE_SIZE, womRankFilter ?? undefined);
  const { data: stats } = useRankingStats();

  const players = data?.players ?? [];
  const visiblePlayers = clanRankFilter ? players.filter((p) => p.clan_rank === clanRankFilter) : players;
  const distTotal = stats ? Object.values(stats.rank_distribution).reduce((s, n) => s + n, 0) : 0;

  return (
    <div className="space-y-4">
      <FilterToolbar
        search=""
        onSearchChange={() => {}}
        compact={compact}
        onCompactToggle={() => setDensity(density === "comfortable" ? "compact" : "comfortable")}
        showSearch={false}
      />

      {stats && <RankingStats stats={stats} compact={compact} />}

      {stats && (
        <div className="flex h-2 rounded-full overflow-hidden">
          {ALL_WOM_RANKS.map((r) => {
            const count = stats.rank_distribution[r] ?? 0;
            const pct = distTotal > 0 ? (count / distTotal) * 100 : 0;
            return <div key={r} className={WOM_RANK_BAR_COLOR[r]} style={{ width: `${pct}%` }} title={`${r}: ${count}`} />;
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-muted-foreground shrink-0">WOM rank:</span>
        <button
          onClick={() => { setWomRankFilter(null); setPage(0); }}
          className={cn(
            "rounded-md px-3 py-0.5 text-xs font-medium transition-colors border",
            compact && "px-2 py-px",
            !womRankFilter ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary",
          )}
        >
          All ({distTotal})
        </button>
        {ALL_WOM_RANKS.filter((r) => !stats || (stats.rank_distribution[r] ?? 0) > 0).map((r) => (
          <button
            key={r}
            onClick={() => { setWomRankFilter(r); setPage(0); }}
            className={cn(
              "rounded-md px-3 py-0.5 text-xs font-medium transition-colors border",
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

      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-muted-foreground shrink-0">Clan rank:</span>
        <RankFilterPills active={clanRankFilter} onChange={setClanRankFilter} compact={compact} counts={stats?.clan_rank_distribution} />
      </div>

      {isLoading ? (
        <RankingTabSkeleton compact={compact} />
      ) : (
        <RankingTable players={visiblePlayers} offset={page * PAGE_SIZE} compact={compact} ownRsns={ownRsns} onSelect={setSelectedPlayer} />
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center gap-2 justify-center text-sm">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </Button>
          <span className="text-muted-foreground">Page {page + 1} of {Math.ceil(data.total / PAGE_SIZE)}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * PAGE_SIZE >= data.total}>
            Next
          </Button>
        </div>
      )}

      <RankingPlayerSheet player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}
