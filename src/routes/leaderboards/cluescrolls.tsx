import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { leaderboardsRoute } from "@/routes/leaderboards";
import { cn } from "@/lib/utils";
import { LeaderboardSkeleton } from "@/components/skeletons/LeaderboardSkeleton";
import { FilterToolbar } from "@/components/leaderboards/FilterToolbar";
import { ClueTierCard } from "@/components/leaderboards/cluescrolls/ClueTierCard";
import { useLeaderboardContext } from "@/components/leaderboards/LeaderboardContext";
import { useCluescrollLeaderboard } from "@/hooks/useLeaderboards";
import { resolveFilterRank, gemRankCounts } from "@/lib/leaderboardRanks";
import type { ClueTier } from "@/types/leaderboard";

export const leaderboardsCluescrollsRoute = createRoute({
  getParentRoute: () => leaderboardsRoute,
  path: "cluescrolls",
  component: CluescrollsLeaderboardTab,
});

function CluescrollsLeaderboardTab(): React.ReactElement {
  const { compact, setDensity, density } = useLeaderboardContext();
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data: tiers = [], isLoading } = useCluescrollLeaderboard();

  if (isLoading) return <LeaderboardSkeleton />;

  const allEntries = (tiers as ClueTier[]).flatMap((t) => t.entries);
  const counts = gemRankCounts(allEntries);

  const filteredTiers = (tiers as ClueTier[])
    .map((tier) => ({
      ...tier,
      entries: rankFilter ? tier.entries.filter((e) => resolveFilterRank(e) === rankFilter) : tier.entries,
    }))
    .filter((tier) => tier.entries.length > 0);

  const q = search.trim().toLowerCase();
  const visibleTiers = q
    ? filteredTiers.filter(
        (tier) =>
          tier.display_name.toLowerCase().includes(q) ||
          tier.entries.some((e) => e.player_name.toLowerCase().includes(q)),
      )
    : filteredTiers;

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
        searchPlaceholder="Search tier or player..."
        rankCounts={counts}
      />
      {visibleTiers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cluescroll data matches this filter.</p>
      ) : (
        <div className={cn("grid gap-4", cols)}>
          {visibleTiers.map((tier) => (
            <ClueTierCard key={tier.metric} tier={tier} compact={compact} exactMatch={q || undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
