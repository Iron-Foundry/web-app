import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { shineHandlers } from "@/hooks/useShineEffect";
import { CompetitionSkeleton } from "@/components/skeletons/CompetitionSkeleton";
import { useMetricDetail, useCompetitionOvertime } from "@/hooks/useCompetitions";
import { sanitizeParticipations, buildTeamRows, buildRaidRows, buildRaidTeamRows, mergeRaidOvertimeSeries, fmtCompetitionLabel, VARIANT_LABELS } from "@/lib/competitions";
import { ClassicChart, TeamChart, TimelineChart, PlayerFilterStrip, RaidStackedChart, RaidTeamStackedChart } from "./CompetitionCharts";
import { ClassicTable, TeamTable, RaidClassicTable, RaidTeamTable } from "./CompetitionTables";
import type { Competition } from "@/types/competitions";
import type { TabDescriptor } from "@/lib/competitions";

function usePlayerFilter(series: Array<{ player_name: string }>, loadingDep: boolean) {
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

export function RaidGroupContent({ comp, tab }: { comp: Competition; tab: Extract<TabDescriptor, { kind: "raid" }> }) {
  const results = tab.variants.map((v) => ({
    metric: v,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    query: useMetricDetail(comp.id, v),
  }));
  const overtimeResults = tab.variants.map((v) => ({
    metric: v,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    query: useCompetitionOvertime(comp.id, v, 20),
  }));

  const overtimeLoading = overtimeResults.some((r) => r.query.isLoading);
  const mergedSeries = mergeRaidOvertimeSeries(overtimeResults.map((r) => r.query.data?.series ?? []));
  const { activePlayers, togglePlayer } = usePlayerFilter(mergedSeries, overtimeLoading);

  const isLoading = results.some((r) => r.query.isLoading);
  if (isLoading) return <CompetitionSkeleton />;

  const anyFailed = results.some((r) => !r.query.data);
  if (anyFailed) return <p className="py-8 text-center text-sm text-muted-foreground">Failed to load data. Try again shortly.</p>;

  const isTeam = results[0]?.query.data?.type === "team";
  const compStatus = results[0]?.query.data?.status ?? "finished";
  const variantData = results.map((r) => ({ metric: r.metric, participations: r.query.data!.participations }));
  const rows = buildRaidRows(variantData);
  const teams = isTeam ? buildRaidTeamRows(rows) : [];
  const noHistory = mergedSeries.every((s) => s.history.length === 0);
  const primaryMetric = tab.variants[0]!;
  const primaryLabel = VARIANT_LABELS[primaryMetric] ?? fmtCompetitionLabel(primaryMetric);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="shine-border rounded-xl min-w-0 md:flex-1 flex flex-col" {...shineHandlers}>
          <Card className="flex-1">
            <CardHeader className="pb-2 pt-4 px-4">
              <p className="text-sm font-medium text-muted-foreground">Top 10 by Total KC</p>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {isTeam ? <RaidTeamStackedChart teams={teams} variants={tab.variants} /> : <RaidStackedChart rows={rows} variants={tab.variants} />}
            </CardContent>
          </Card>
        </div>
        <div className="shine-border rounded-xl min-w-0 md:flex-1 flex flex-col" {...shineHandlers}>
          <Card className="flex-1">
            <CardHeader className="pb-2 pt-4 px-4">
              <p className="text-sm font-medium text-muted-foreground">{primaryLabel} Over Time (Top 10)</p>
            </CardHeader>
            <CardContent className="px-2 pb-4">
            {overtimeLoading && <CompetitionSkeleton />}
            {!overtimeLoading && mergedSeries.length > 0 && !noHistory && (
              <>
                <PlayerFilterStrip series={mergedSeries} activePlayers={activePlayers} onToggle={togglePlayer} />
                <TimelineChart series={mergedSeries} metric={primaryMetric} activePlayers={activePlayers} />
              </>
            )}
            {!overtimeLoading && (noHistory || mergedSeries.length === 0) && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {compStatus === "upcoming" ? "Competition hasn't started yet." : "No timeline data available."}
              </p>
            )}
          </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium text-muted-foreground">
            {isTeam ? "Team Standings" : `All Participants (${rows.length})`}
          </p>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {isTeam ? <RaidTeamTable teams={teams} variants={tab.variants} /> : <RaidClassicTable rows={rows} variants={tab.variants} />}
        </CardContent>
      </Card>
    </div>
  );
}
