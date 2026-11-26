import { useState } from "react";
import { createRoute, useRouter } from "@tanstack/react-router";
import { Download, Eye, X } from "lucide-react";
import { rootRoute } from "./__root";
import { registerPage } from "@/lib/permissions";
import { buildMetricTabs, fmtCompetitionLabel, type TabDescriptor } from "@/lib/competitions";
import { tabKey } from "@/lib/competition-metric-groups";
import { MetricTabGroups } from "@/components/competitions/MetricTabGroups";
import { useCompetitionList, useCompetitionMetricMap } from "@/hooks/useCompetitions";
import { CompetitionSkeleton } from "@/components/skeletons/CompetitionSkeleton";
import { MetricTabContent } from "@/components/competitions/TabContent";
import { RaidGroupContent } from "@/components/competitions/RaidGroupContent";
import { PluginNotice } from "@/components/competitions/PluginNotice";
import { CompetitionPicker } from "@/components/competitions/CompetitionPicker";
import { CompetitionHeader } from "@/components/competitions/CompetitionHeader";
import { PreviewAsSelect, useExport } from "@/components/competitions/CompetitionTools";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/button";

registerPage({
  id: "competitions",
  label: "Competitions",
  description: "View multi-metric competition standings and charts.",
});

export const competitionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/competitions/$compId",
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: () => <CompetitionsPage />,
});

const EMPTY = "rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground";

export default function CompetitionsPage() {
  const { compId } = competitionDetailRoute.useParams();
  const { tab } = competitionDetailRoute.useSearch();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const { data: competitions = [], isLoading: compsLoading } = useCompetitionList();
  const { data: metricMap = {}, isLoading: metricMapLoading } = useCompetitionMetricMap();

  const resolvedId = compId === "latest"
    ? String(competitions.find((c) => c.status === "ongoing")?.id ?? competitions.find((c) => c.status === "upcoming")?.id ?? "")
    : compId;

  const selected = competitions.find((c) => String(c.id) === resolvedId);
  const metrics = resolvedId ? (metricMap[resolvedId] ?? []) : [];
  const tabs = buildMetricTabs(metrics);
  const firstTabKey = tabs[0] ? tabKey(tabs[0]) : "";
  const effectiveTab = tab || firstTabKey;
  const configuredTabDescriptor = tabs.find((t) => tabKey(t) === effectiveTab);
  const isPreviewMode = !!effectiveTab && !configuredTabDescriptor && !!selected;
  const activeTabDescriptor: TabDescriptor | undefined = configuredTabDescriptor
    ?? (effectiveTab ? { kind: "single" as const, metric: effectiveTab, label: fmtCompetitionLabel(effectiveTab) } : undefined);

  const { exportMetrics, handleExport, exporting, exportError } = useExport(selected, resolvedId, activeTabDescriptor);

  function handleCompSelect(id: string) {
    void router.navigate({ to: "/competitions/$compId", params: { compId: id }, search: { tab: undefined } });
  }
  function handleTabChange(newTab: string) {
    if (!newTab) return;
    void router.navigate({ to: "/competitions/$compId", params: { compId }, search: { tab: newTab } });
  }
  function copyShareLink() {
    if (!resolvedId) return;
    const url = `${window.location.origin}/competitions/${resolvedId}?t=${Math.floor(Date.now() / 1000)}`;
    void navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  function exitPreview() {
    void router.navigate({ to: "/competitions/$compId", params: { compId }, search: { tab: firstTabKey || undefined } });
  }

  const noActiveCompetitions = !compsLoading && resolvedId === "";
  const notFound = !compsLoading && resolvedId !== "" && !selected;
  const noMetrics = !metricMapLoading && !!selected && metrics.length === 0 && !isPreviewMode;

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
      <PageHead title="Competitions" />

      <PluginNotice />

      {!compsLoading && <CompetitionPicker competitions={competitions} selectedId={resolvedId} onSelect={handleCompSelect} />}

      {noActiveCompetitions && <p className={EMPTY}>No active competitions at this time.</p>}
      {notFound && <p className={EMPTY}>Competition not found.</p>}

      {selected && <CompetitionHeader comp={selected} onShare={copyShareLink} copied={copied} />}

      {selected && metricMapLoading && !effectiveTab && <CompetitionSkeleton />}

      {noMetrics && (
        <div className="space-y-4 rounded-xl border border-border bg-card py-10 text-center">
          <div>
            <p className="text-sm text-muted-foreground">No metrics configured for this competition yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Staff can add metrics at Members / Staff / Competitions.</p>
          </div>
          <div className="flex justify-center"><PreviewAsSelect onSelect={handleTabChange} /></div>
        </div>
      )}

      {selected && (tabs.length > 0 || isPreviewMode) && (
        <div className="space-y-4">
          {tabs.length > 0 && (
            <MetricTabGroups
              tabs={tabs}
              value={isPreviewMode ? "" : effectiveTab}
              onValueChange={handleTabChange}
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <PreviewAsSelect onSelect={handleTabChange} />
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => void handleExport()} disabled={exportMetrics.length === 0 || exporting}>
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting..." : exportError ? "Export failed" : "Export Top 5"}
            </Button>
            {isPreviewMode && activeTabDescriptor && (
              <div className="flex items-center gap-1.5 rounded-lg border border-mk-yellow/35 bg-mk-yellow/10 px-2.5 py-1 text-sm">
                <Eye className="h-3.5 w-3.5 shrink-0 text-mk-yellow" />
                <span>Previewing: {activeTabDescriptor.label}</span>
                <button type="button" aria-label="Exit preview" className="ml-0.5 rounded p-0.5 hover:bg-muted" onClick={exitPreview}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          {activeTabDescriptor?.kind === "single" && <MetricTabContent comp={selected} metric={activeTabDescriptor.metric} />}
          {activeTabDescriptor?.kind === "raid" && <RaidGroupContent comp={selected} tab={activeTabDescriptor} />}
        </div>
      )}

    </div>
  );
}
