import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { leaderboardsRoute } from "@/routes/leaderboards";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RankingTabSkeleton } from "@/components/skeletons/LeaderboardSkeleton";
import { FilterToolbar } from "@/components/leaderboards/FilterToolbar";
import { RankFilterPills } from "@/components/leaderboards/RankFilterPills";
import { RankingStats } from "@/components/leaderboards/ranking/RankingStats";
import { useLeaderboardContext } from "@/components/leaderboards/LeaderboardContext";
import { useRankingResults, useRankingStats } from "@/hooks/useLeaderboards";
import { useOwnRsns } from "@/hooks/useOwnRsns";
import { ALL_WOM_RANKS, WOM_RANK_COLOR, WOM_RANK_BAR_COLOR, GEM_RANK_COLOR } from "@/lib/leaderboardRanks";
import { fmtNum } from "@/components/leaderboards/RankRow";

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
        rankFilter={null}
        onRankFilterChange={() => {}}
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
            "rounded-full px-3 py-0.5 text-xs font-medium transition-colors border",
            compact && "px-2 py-px",
            !womRankFilter ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary",
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

      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-muted-foreground shrink-0">Clan rank:</span>
        <RankFilterPills active={clanRankFilter} onChange={setClanRankFilter} compact={compact} counts={stats?.clan_rank_distribution} />
      </div>

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
                    <td className={cn("px-3 py-2 font-mono font-medium", compact && "py-1 text-xs", ownRsns.has(p.rsn.toLowerCase()) && "own-rsn")}>{p.rsn}</td>
                    <td className={cn("px-3 py-2", compact && "py-1", GEM_RANK_COLOR[p.clan_rank ?? ""] ?? "text-muted-foreground")}>
                      <span className="text-xs">{p.clan_rank ?? "-"}</span>
                    </td>
                    <td className={cn("px-3 py-2", compact && "py-1", WOM_RANK_COLOR[p.rank] ?? "text-muted-foreground")}>
                      <span className="text-xs">{p.rank}</span>
                    </td>
                    <td className={cn("px-3 py-2 text-right tabular-nums", compact && "py-1 text-xs")}>{fmtNum(p.points)}</td>
                    {!compact && (
                      <>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground text-xs">
                          {fmtNum(p.boss_points)}<span className="ml-1 text-muted-foreground/60">({bossPct}%)</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground text-xs">
                          {fmtNum(p.skill_points)}<span className="ml-1 text-muted-foreground/60">({100 - bossPct}%)</span>
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
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </Button>
          <span className="text-muted-foreground">Page {page + 1} of {Math.ceil(data.total / PAGE_SIZE)}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * PAGE_SIZE >= data.total}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
