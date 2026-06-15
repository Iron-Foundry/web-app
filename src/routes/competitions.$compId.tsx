import { useState, useEffect } from "react";
import { createRoute, useRouter } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { registerPage } from "@/lib/permissions";
import { fmtCompDate, buildMetricTabs, fmtCompetitionLabel, statusColor } from "@/lib/competitions";
import type { TabDescriptor } from "@/lib/competitions";
import { useCompetitionList, useCompetitionMetricMap } from "@/hooks/useCompetitions";
import { CompetitionSkeleton } from "@/components/skeletons/CompetitionSkeleton";
import { MetricTabContent, RaidGroupContent } from "@/components/competitions/TabContent";
import type { Competition } from "@/types/competitions";
import metricsConfig from "@/competition-metrics.toml";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { shineHandlers } from "@/hooks/useShineEffect";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Check, Download, Eye, Link, LogOut, Plug, X } from "lucide-react";
import { cn } from "@/lib/utils";

const METRIC_GROUPS: { name: string; metrics: string[] }[] = metricsConfig.groups;

registerPage({
  id: "competitions",
  label: "Competitions",
  description: "View multi-metric competition standings and charts.",
  defaults: { read: [], create: [], edit: [], delete: [] },
});

export const competitionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/competitions/$compId",
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: () => <CompetitionsPage />,
});

function useCountdown(targetIso: string): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return "0s";
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function CompetitionCountdownBanner({ comp }: { comp: Competition }) {
  const startCountdown = useCountdown(comp.startsAt);
  const endCountdown = useCountdown(comp.endsAt);
  if (comp.status === "upcoming") {
    return (
      <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-sm text-blue-400">
        <span className="font-medium shrink-0">Starting in:</span>
        <span className="font-mono">{startCountdown}</span>
      </div>
    );
  }
  if (comp.status === "ongoing") {
    return (
      <div className="inline-flex items-center gap-2 rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-sm text-green-400">
        <span className="font-medium shrink-0">Ending in:</span>
        <span className="font-mono">{endCountdown}</span>
      </div>
    );
  }
  return null;
}

function PreviewAsSelect({ onSelect }: { onSelect: (metric: string) => void }) {
  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger className="w-52 h-9 text-sm gap-1.5">
        <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="Preview metric..." />
      </SelectTrigger>
      <SelectContent>
        {METRIC_GROUPS.map((group) => (
          <SelectGroup key={group.name}>
            <SelectLabel>{group.name}</SelectLabel>
            {group.metrics.map((m) => <SelectItem key={m} value={m}>{fmtCompetitionLabel(m)}</SelectItem>)}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

function useExport(selected: Competition | undefined, resolvedId: string, activeTabDescriptor: TabDescriptor | undefined) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const exportMetrics = activeTabDescriptor?.kind === "raid"
    ? activeTabDescriptor.variants
    : activeTabDescriptor?.metric ? [activeTabDescriptor.metric] : [];
  const exportLabel = activeTabDescriptor?.kind === "raid" ? activeTabDescriptor.label : undefined;

  async function handleExport() {
    if (!selected || exportMetrics.length === 0) return;
    setExporting(true);
    try {
      const params = new URLSearchParams({ id: resolvedId });
      for (const m of exportMetrics) params.append("metric", m);
      if (exportLabel) params.set("label", exportLabel);
      const res = await fetch(`/embed/competition-top5.png?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${selected.title.replace(/\s+/g, "-")}-top5.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Export failed:", err);
      setExportError(true);
      setTimeout(() => setExportError(false), 3000);
    } finally {
      setExporting(false);
    }
  }

  return { exportMetrics, handleExport, exporting, exportError };
}

function tabKey(t: TabDescriptor): string {
  return t.kind === "raid" ? t.groupKey : t.metric;
}

function CompetitionCard({
  comp,
  isSelected,
  onSelect,
}: {
  comp: Competition;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      className={cn(
        "text-left rounded-lg border p-3 transition-colors hover:bg-accent/50 w-full cursor-pointer",
        isSelected ? "border-primary bg-accent/30" : "border-border bg-card",
      )}
      onClick={() => onSelect(String(comp.id))}
    >
      <div className="font-medium text-sm truncate">{comp.title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {fmtCompDate(comp.startsAt)} – {fmtCompDate(comp.endsAt)}
      </div>
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <Badge variant="outline" className="text-xs px-1.5 py-0">{comp.type === "team" ? "Team" : "Classic"}</Badge>
        <Badge variant="outline" className="text-xs px-1.5 py-0">{comp.participantCount} participants</Badge>
      </div>
    </button>
  );
}

const ENDED_LIMIT = 5;

function CompetitionSection({
  title,
  accent,
  competitions,
  selectedId,
  onSelect,
  limit,
}: {
  title: string;
  accent: string;
  competitions: Competition[];
  selectedId: string;
  onSelect: (id: string) => void;
  limit?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  if (competitions.length === 0) return null;
  const visible = limit && !showAll ? competitions.slice(0, limit) : competitions;
  return (
    <div className="space-y-2">
      <h2 className={cn("text-xs font-semibold uppercase tracking-wider", accent)}>{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {visible.map((c) => (
          <CompetitionCard key={c.id} comp={c} isSelected={selectedId === String(c.id)} onSelect={onSelect} />
        ))}
      </div>
      {limit && competitions.length > limit && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? "Show less" : `Show ${competitions.length - limit} more…`}
        </button>
      )}
    </div>
  );
}

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

  const grouped = {
    ongoing: competitions.filter((c) => c.status === "ongoing"),
    upcoming: competitions.filter((c) => c.status === "upcoming"),
    finished: competitions.filter((c) => c.status === "finished"),
  };
  const noActiveCompetitions = !compsLoading && resolvedId === "";
  const notFound = !compsLoading && resolvedId !== "" && !selected;
  const noMetrics = !metricMapLoading && !!selected && metrics.length === 0 && !isPreviewMode;

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
      <h1 className="font-rs-bold text-4xl text-primary">Competitions</h1>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <Plug className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
          <div className="space-y-2.5">
            <p className="text-sm font-medium text-amber-300">XP Updater Plugin Required</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60" />
                Install and enable the <span className="text-foreground font-medium">XP Updater</span> plugin in RuneLite, with the <span className="text-foreground font-medium">WiseOldMan</span> option ticked.
              </li>
              <li className="flex items-start gap-2">
                <LogOut className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500/60" />
                Log out once the competition has <span className="text-foreground font-medium">started</span> to set your baseline snapshot.
              </li>
              <li className="flex items-start gap-2">
                <LogOut className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500/60" />
                Log out before the competition <span className="text-foreground font-medium">ends</span> to set an accurate final snapshot.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {!compsLoading && (
        <div className="space-y-5">
          <CompetitionSection title="Ongoing" accent="text-green-400" competitions={grouped.ongoing} selectedId={resolvedId} onSelect={handleCompSelect} />
          <CompetitionSection title="Upcoming" accent="text-blue-400" competitions={grouped.upcoming} selectedId={resolvedId} onSelect={handleCompSelect} />
          <CompetitionSection title="Ended" accent="text-muted-foreground" competitions={grouped.finished} selectedId={resolvedId} onSelect={handleCompSelect} limit={ENDED_LIMIT} />
        </div>
      )}

      {noActiveCompetitions && <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground text-sm">No active competitions at this time.</p></CardContent></Card>}
      {notFound && <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground text-sm">Competition not found.</p></CardContent></Card>}

      {selected && (
        <div className="shine-border rounded-xl" {...shineHandlers}>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold truncate">{selected.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{fmtCompDate(selected.startsAt)} - {fmtCompDate(selected.endsAt)}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
                <Badge className={statusColor(selected.status)}>{selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}</Badge>
                <Badge variant="outline">{selected.type === "team" ? "Team" : "Classic"}</Badge>
                <Badge variant="outline">{selected.participantCount} participants</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={copyShareLink} title="Copy share link (busts Discord cache)">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="mt-2"><CompetitionCountdownBanner comp={selected} /></div>
          </CardContent>
        </Card>
        </div>
      )}

      {selected && metricMapLoading && !effectiveTab && <CompetitionSkeleton />}

      {noMetrics && (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">No metrics configured for this competition yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Staff can add metrics at Members / Staff / Competitions.</p>
            </div>
            <div className="flex justify-center"><PreviewAsSelect onSelect={handleTabChange} /></div>
          </CardContent>
        </Card>
      )}

      {selected && (tabs.length > 0 || isPreviewMode) && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {tabs.length > 0 && (
              <ToggleGroup type="single" variant="outline" value={isPreviewMode ? "" : effectiveTab} onValueChange={handleTabChange}>
                {tabs.map((t) => <ToggleGroupItem key={tabKey(t)} value={tabKey(t)}>{t.label}</ToggleGroupItem>)}
              </ToggleGroup>
            )}
            <PreviewAsSelect onSelect={handleTabChange} />
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => void handleExport()} disabled={exportMetrics.length === 0 || exporting}>
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting..." : exportError ? "Export failed" : "Export Top 5"}
            </Button>
            {isPreviewMode && activeTabDescriptor && (
              <div className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400">
                <Eye className="h-3 w-3 shrink-0" />
                <span>Previewing: {activeTabDescriptor.label}</span>
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-0.5 text-amber-400 hover:text-amber-300 hover:bg-transparent" onClick={exitPreview}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          {activeTabDescriptor?.kind === "single" && <MetricTabContent comp={selected} metric={activeTabDescriptor.metric} />}
          {activeTabDescriptor?.kind === "raid" && <RaidGroupContent comp={selected} tab={activeTabDescriptor} />}
        </div>
      )}

      <Separator className="hidden" />
    </div>
  );
}
