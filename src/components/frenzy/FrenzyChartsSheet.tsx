import { useState } from "react";
import { BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FrenzyPointsChart } from "./FrenzyPointsChart";
import { FrenzyPlayerChart } from "./FrenzyPlayerChart";
import { useTeamHistory } from "@/hooks/useFrenzy";
import type { FrenzyHistoryPoint, FrenzySubmissionType, FrenzyTeamHistory } from "@/types/frenzy";

type TypeFilter = FrenzySubmissionType | "all";

function recomputeSeries(
  raw: FrenzyHistoryPoint[],
  typeFilter: TypeFilter,
  playerFilter: string,
): FrenzyHistoryPoint[] {
  if (raw.length === 0) return [];

  const filtered = raw.filter(
    (p) =>
      (typeFilter === "all" || p.submission_type === typeFilter) &&
      (playerFilter === "all" || p.player_rsn === playerFilter),
  );

  // Reaccumulate cumulative points from deltas of the filtered subset
  // delta[i] ≈ series[i].total_points - series[i-1].total_points
  const deltas = raw.map((p, i) => ({
    ...p,
    delta: i === 0 ? p.total_points : p.total_points - (raw[i - 1]?.total_points ?? 0),
  }));

  const filteredDeltas = deltas.filter(
    (p) =>
      (typeFilter === "all" || p.submission_type === typeFilter) &&
      (playerFilter === "all" || p.player_rsn === playerFilter),
  );

  let cumulative = 0;
  return filteredDeltas.map((p) => {
    cumulative += p.delta;
    return { ...p, total_points: cumulative };
  });
}

function recomputeContribution(
  raw: FrenzyHistoryPoint[],
  typeFilter: TypeFilter,
  playerFilter: string,
): Record<string, number> {
  // We only have per-item point data in the series (activities/milestones are not attributed)
  // Recompute from filtered item submissions using raw delta logic
  const deltas = raw.map((p, i) => ({
    ...p,
    delta: i === 0 ? p.total_points : p.total_points - (raw[i - 1]?.total_points ?? 0),
  }));

  const contrib: Record<string, number> = {};
  for (const p of deltas) {
    if (typeFilter !== "all" && p.submission_type !== typeFilter) continue;
    if (playerFilter !== "all" && p.player_rsn !== playerFilter) continue;
    contrib[p.player_rsn] = (contrib[p.player_rsn] ?? 0) + p.delta;
  }
  return contrib;
}

interface Props {
  teamSlug: string;
  teamName: string;
  participants: string[];
}

export function FrenzyChartsSheet({ teamSlug, teamName, participants }: Props) {
  const [open, setOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [playerFilter, setPlayerFilter] = useState("all");

  const { data: history } = useTeamHistory(teamSlug);

  const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "item", label: "Items" },
    { value: "activity", label: "Activities" },
    { value: "milestone", label: "Milestones" },
  ];

  const filteredSeries = history
    ? recomputeSeries(history.series, typeFilter, playerFilter)
    : [];

  const filteredContrib = history
    ? recomputeContribution(history.series, typeFilter, playerFilter)
    : {};

  const filteredHistory: FrenzyTeamHistory | null = history
    ? { ...history, series: filteredSeries, player_contribution: filteredContrib }
    : null;

  const allPlayers = participants.length > 0 ? participants : Object.keys(history?.player_contribution ?? {});

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart2 className="h-4 w-4 mr-1.5" />
          Charts
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto flex flex-col gap-0"
      >
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>{teamName} - Analytics</SheetTitle>
        </SheetHeader>

        {/* Filters */}
        <div className="px-4 py-3 border-b space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</p>
            <div className="flex gap-1.5 flex-wrap">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    typeFilter === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Player</p>
            <select
              className="text-sm border rounded px-2 py-1 bg-background w-full max-w-xs"
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
            >
              <option value="all">All players</option>
              {allPlayers.map((rsn) => (
                <option key={rsn} value={rsn}>{rsn}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Charts */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {!history && (
            <p className="text-sm text-muted-foreground">Loading history...</p>
          )}

          {filteredHistory && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Points Over Time</p>
                <FrenzyPointsChart history={filteredHistory} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Player Contribution</p>
                <FrenzyPlayerChart history={filteredHistory} />
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
