import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { shineHandlers } from "@/hooks/useShineEffect";
import { CompetitionSkeleton } from "@/components/skeletons/CompetitionSkeleton";
import { useMetricDetail, useCompetitionOvertime } from "@/hooks/useCompetitions";
import { sanitizeParticipations, buildTeamRows } from "@/lib/competitionRows";
import { ClassicChart, TeamChart } from "./CompetitionCharts";
import { TimelineChart, PlayerFilterStrip } from "./TimelineChart";
import { ClassicTable, TeamTable } from "./CompetitionTables";
import type { Competition } from "@/types/competitions";

export function usePlayerFilter(series: Array<{ player_name: string }>, loadingDep: boolean) {
  const [activePlayers, setActivePlayers] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (series.length > 0) setActivePlayers(new Set(series.map((s) => s.player_name)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingDep]);
  function togglePlayer(name: string) {
    setActivePlayers((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  }
  return { activePlayers, togglePlayer };
}

function TimelineCard({ comp, metric, label }: { comp: Competition; metric: string; label: string }) {
  const { data: overtime, isLoading } = useCompetitionOvertime(comp.id, metric, 10);
  const noHistory = overtime?.series.every((s) => s.history.length === 0);
  const { activePlayers, togglePlayer } = usePlayerFilter(overtime?.series ?? [], isLoading);

  return (
    <div className="shine-border rounded-xl min-w-0 md:flex-1 flex flex-col" {...shineHandlers}>
      <Card className="flex-1">
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium text-muted-foreground">{label} (Top 10)</p>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {isLoading && <CompetitionSkeleton />}
          {!isLoading && overtime && !noHistory && (
            <>
              <PlayerFilterStrip series={overtime.series} activePlayers={activePlayers} onToggle={togglePlayer} />
              <TimelineChart series={overtime.series} metric={metric} activePlayers={activePlayers} />
            </>
          )}
          {!isLoading && (noHistory || !overtime) && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {comp.status === "upcoming" ? "Competition hasn't started yet." : "No timeline data available."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function MetricTabContent({ comp, metric }: { comp: Competition; metric: string }) {
  const { data: detail, isLoading } = useMetricDetail(comp.id, metric);

  if (isLoading) return <CompetitionSkeleton />;
  if (!detail) return <p className="py-8 text-center text-sm text-muted-foreground">Failed to load data. Try again shortly.</p>;

  const sanitized = sanitizeParticipations(detail.participations);
  const isTeam = detail.type === "team";
  const teams = isTeam ? buildTeamRows(sanitized) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="shine-border rounded-xl min-w-0 md:flex-1 flex flex-col" {...shineHandlers}>
          <Card className="flex-1">
            <CardHeader className="pb-2 pt-4 px-4">
              <p className="text-sm font-medium text-muted-foreground">Top 10 by Gained</p>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {isTeam ? <TeamChart teams={teams} metric={metric} /> : <ClassicChart participations={sanitized} metric={metric} />}
            </CardContent>
          </Card>
        </div>
        <TimelineCard comp={comp} metric={metric} label="Progress Over Time" />
      </div>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium text-muted-foreground">
            {isTeam ? "Team Standings" : `All Participants (${sanitized.length})`}
          </p>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {isTeam ? <TeamTable teams={teams} metric={metric} /> : <ClassicTable participations={sanitized} metric={metric} />}
        </CardContent>
      </Card>
    </div>
  );
}
