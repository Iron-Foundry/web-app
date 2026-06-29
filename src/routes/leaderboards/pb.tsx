import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { leaderboardsRoute } from "@/routes/leaderboards";
import { cn } from "@/lib/utils";
import { LeaderboardSkeleton } from "@/components/skeletons/LeaderboardSkeleton";
import { FilterToolbar } from "@/components/leaderboards/FilterToolbar";
import { RaidCarouselCard } from "@/components/leaderboards/pb/RaidCarouselCard";
import { NonRaidCard } from "@/components/leaderboards/pb/NonRaidCard";
import { useLeaderboardContext } from "@/components/leaderboards/LeaderboardContext";
import { usePbLeaderboard } from "@/hooks/useLeaderboards";
import { resolveFilterRank, gemRankCounts } from "@/lib/leaderboardRanks";
import { groupPbs, buildRaidGroups, raidGroupKey, type Grouped, type RaidGroup } from "@/lib/pbHelpers";

export const leaderboardsPbRoute = createRoute({
  getParentRoute: () => leaderboardsRoute,
  path: "pb",
  component: PbLeaderboardTab,
});

function PbLeaderboardTab(): React.ReactElement {
  const { compact, setDensity, density } = useLeaderboardContext();
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data: entries = [], isLoading } = usePbLeaderboard();

  if (isLoading) return <LeaderboardSkeleton />;

  const counts = gemRankCounts(entries);
  const filtered = rankFilter ? entries.filter((e) => resolveFilterRank(e) === rankFilter) : entries;
  const grouped = groupPbs(filtered);
  const activities = Object.keys(grouped).sort();
  const raidGroups = buildRaidGroups(grouped);

  type CardItem =
    | { type: "raid"; group: RaidGroup; sortKey: string }
    | { type: "non-raid"; activity: string; sortKey: string };

  const cards: CardItem[] = [];
  for (const group of raidGroups.values()) {
    cards.push({ type: "raid", group, sortKey: group.activities[0] ?? group.groupKey });
  }
  for (const activity of activities) {
    if (raidGroupKey(activity) === null) cards.push({ type: "non-raid", activity, sortKey: activity });
  }
  cards.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const q = search.trim().toLowerCase();
  const visibleCards = q
    ? cards.filter((card) => {
        if (card.type === "non-raid") {
          if (card.activity.toLowerCase().includes(q)) return true;
          return Object.values((grouped as Grouped)[card.activity] ?? {}).flat()
            .some((e) => e.player_name.toLowerCase().includes(q));
        }
        return card.group.activities.some((act) => {
          if (act.toLowerCase().includes(q)) return true;
          return Object.values((grouped as Grouped)[act] ?? {}).flat()
            .some((e) => e.player_name.toLowerCase().includes(q));
        });
      })
    : cards;

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
        searchPlaceholder="Search activity or player..."
        rankCounts={counts}
      />
      {visibleCards.length === 0 ? (
        <p className="text-sm text-muted-foreground">No times match this filter.</p>
      ) : (
        <div className={cn("grid gap-4", cols)}>
          {visibleCards.map((card) =>
            card.type === "raid" ? (
              <RaidCarouselCard key={card.group.groupKey} group={card.group} grouped={grouped as Grouped} compact={compact} exactMatch={q || undefined} />
            ) : (
              <NonRaidCard key={card.activity} activity={card.activity} variantMap={(grouped as Grouped)[card.activity]!} compact={compact} exactMatch={q || undefined} />
            )
          )}
        </div>
      )}
    </div>
  );
}
