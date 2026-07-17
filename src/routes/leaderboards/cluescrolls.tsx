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

  // This page's container caps at max-w-7xl (1280px) and never gets wider,
  // and the root layout adds px-6 (48px) around it - so available width
  // plateaus well under 1280px regardless of viewport. Comfortable mode's
  // fixed row overhead (rank + CC Rank + value + gaps = 188px) doesn't
  // leave a 12-char RSN enough room in 4 columns at any container width
  // this page can reach, so comfortable stays single-column. Compact's
  // overhead is much cheaper (auto-sized CC Rank/value), so 4 columns only
  // once the container is near its 1280px ceiling; a 5th column would only
  // ever shrink cards further since the container can't grow past that cap.
  const cols = compact
    ? "grid-cols-1 xl:grid-cols-4"
    : "grid-cols-1";

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
