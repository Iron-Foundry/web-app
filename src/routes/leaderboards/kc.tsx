import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { leaderboardsRoute } from "@/routes/leaderboards";
import { cn } from "@/lib/utils";
import { LeaderboardSkeleton } from "@/components/skeletons/LeaderboardSkeleton";
import { FilterToolbar } from "@/components/leaderboards/FilterToolbar";
import { KcBossCard } from "@/components/leaderboards/kc/KcBossCard";
import { useLeaderboardContext } from "@/components/leaderboards/LeaderboardContext";
import { useKillcountLeaderboard } from "@/hooks/useLeaderboards";
import { resolveFilterRank, gemRankCounts } from "@/lib/leaderboardRanks";
import type { KcBoss } from "@/types/leaderboard";

export const leaderboardsKcRoute = createRoute({
  getParentRoute: () => leaderboardsRoute,
  path: "kc",
  component: KcLeaderboardTab,
});

function KcLeaderboardTab(): React.ReactElement {
  const { compact, setDensity, density } = useLeaderboardContext();
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data: bosses = [], isLoading } = useKillcountLeaderboard();

  if (isLoading) return <LeaderboardSkeleton />;

  const allEntries = (bosses as KcBoss[]).flatMap((b) => b.entries);
  const counts = gemRankCounts(allEntries);

  const filteredBosses = (bosses as KcBoss[])
    .map((boss) => ({
      ...boss,
      entries: rankFilter ? boss.entries.filter((e) => resolveFilterRank(e) === rankFilter) : boss.entries,
    }))
    .filter((boss) => boss.entries.length > 0);

  const q = search.trim().toLowerCase();
  const visibleBosses = q
    ? filteredBosses.filter(
        (boss) =>
          boss.display_name.toLowerCase().includes(q) ||
          boss.entries.some((e) => e.player_name.toLowerCase().includes(q)),
      )
    : filteredBosses;

  const cols = compact
    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";

  return (
    <div className="space-y-4">
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        rankFilter={rankFilter}
        onRankFilterChange={setRankFilter}
        compact={compact}
        onCompactToggle={() => setDensity(density === "comfortable" ? "compact" : "comfortable")}
        searchPlaceholder="Search boss or player..."
        rankCounts={counts}
      />
      {visibleBosses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No killcount data matches this filter.</p>
      ) : (
        <div className={cn("grid gap-4", cols)}>
          {visibleBosses.map((boss) => (
            <KcBossCard key={boss.metric} boss={boss} compact={compact} exactMatch={q || undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
