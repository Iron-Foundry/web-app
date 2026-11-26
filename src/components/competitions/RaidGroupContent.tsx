import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { shineHandlers } from "@/hooks/useShineEffect";
import { CompetitionSkeleton } from "@/components/skeletons/CompetitionSkeleton";
import { useMetricDetail, useCompetitionOvertime } from "@/hooks/useCompetitions";
import { fmtCompetitionLabel, VARIANT_LABELS } from "@/lib/competitions";
import { buildRaidRows, buildRaidTeamRows, mergeRaidOvertimeSeries } from "@/lib/competitionRows";
import { TimelineChart, PlayerFilterStrip } from "./TimelineChart";
import { RaidStackedChart, RaidTeamStackedChart } from "./RaidCharts";
import { RaidClassicTable, RaidTeamTable } from "./RaidTables";
import { usePlayerFilter } from "./TabContent";
import type { Competition } from "@/types/competitions";
import type { TabDescriptor } from "@/lib/competitions";

/** A raid group tab: the combined standings, charts and timeline of its variants. */

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
