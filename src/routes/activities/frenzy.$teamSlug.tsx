import { useState, useEffect } from "react";
import { createRoute, Link, useParams } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { useTeamDetail } from "@/hooks/useFrenzy";
import { FrenzyTeamDetail, FRENZY_SECTIONS, type FrenzySection } from "@/components/frenzy/FrenzyTeamDetail";
import { FrenzyChartsSheet } from "@/components/frenzy/FrenzyChartsSheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { isMultiplierUnlocked } from "@/lib/frenzy";

export const frenzyTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activities/frenzy/$teamSlug",
  component: FrenzyTeamPage,
});

function FrenzyTeamPage() {
  const { teamSlug } = useParams({ from: "/activities/frenzy/$teamSlug" });
  const { data: detail, isLoading, isError } = useTeamDetail(teamSlug);
  const [activeSection, setActiveSection] = useState<FrenzySection>("Sources");
  const tierNames = detail ? Object.keys(detail.template.tiers) : [];
  const [activeTier, setActiveTier] = useState("");
  useEffect(() => {
    if (tierNames[0]) setActiveTier(tierNames[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail]);

  const unlockedMultsCount = detail
    ? detail.template.multipliers.filter((m) => isMultiplierUnlocked(m, detail.progress.item_progress)).length
    : 0;

  return (
    <div className="mx-auto max-w-6xl w-full space-y-4 py-6 px-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left: back + tabs */}
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" size="sm" className="self-start">
            <Link to="/activities/frenzy">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Frenzy
            </Link>
          </Button>
          {detail && (
            <>
              <ToggleGroup
                type="single"
                value={activeSection}
                onValueChange={(v) => v && setActiveSection(v as FrenzySection)}
                className="flex-wrap justify-start"
              >
                {FRENZY_SECTIONS.map((s) => (
                  <ToggleGroupItem key={s} value={s} className="text-sm border border-border data-[state=on]:border-primary">
                    {s}
                    {s === "Multipliers" && unlockedMultsCount > 0 && (
                      <Badge variant="default" className="ml-1 text-xs">{unlockedMultsCount}</Badge>
                    )}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {activeSection === "Sources" && tierNames.length > 1 && (
                <ToggleGroup
                  type="single"
                  value={activeTier}
                  onValueChange={(v) => v && setActiveTier(v)}
                  className="flex-wrap justify-start"
                >
                  {tierNames.map((t) => {
                    const sources = detail.template.tiers[t]?.sources ?? [];
                    const total = sources.reduce((n, src) => n + src.items.length, 0);
                    const obtained = sources.reduce((n, src) =>
                      n + src.items.filter((item) => {
                        const key = `${t}.${src.name}.${item.name}`;
                        return (detail.progress.item_progress[key] ?? 0) >= item.required;
                      }).length, 0);
                    return (
                      <ToggleGroupItem key={t} value={t} className="text-sm border border-border data-[state=on]:border-primary">
                        {t}
                        <span className="ml-1 text-xs text-muted-foreground">{obtained}/{total}</span>
                      </ToggleGroupItem>
                    );
                  })}
                </ToggleGroup>
              )}
            </>
          )}
        </div>

        {/* Right: charts + stat cubes */}
        {detail && (
          <div className="flex flex-col items-end gap-2">
            <FrenzyChartsSheet
              teamSlug={teamSlug}
              teamName={detail.name}
              participants={detail.participants}
            />
            <div className="grid grid-cols-4 gap-1">
              {Object.entries(detail.scores.tier_points).map(([tier, pts]) => (
                <div key={tier} className="w-16 h-16 rounded border bg-card flex flex-col items-center justify-center gap-0.5">
                  <p className="text-[9px] text-muted-foreground leading-none">{tier}</p>
                  <p className="text-xs font-bold leading-none">{Math.floor(pts).toLocaleString()}</p>
                </div>
              ))}
              <div className="w-16 h-16 rounded border bg-card flex flex-col items-center justify-center gap-0.5">
                <p className="text-[9px] text-muted-foreground leading-none">Activities</p>
                <p className="text-xs font-bold leading-none">{Math.floor(detail.scores.activity_points).toLocaleString()}</p>
              </div>
              <div className="w-16 h-16 rounded border bg-card flex flex-col items-center justify-center gap-0.5">
                <p className="text-[9px] text-muted-foreground leading-none">Milestones</p>
                <p className="text-xs font-bold leading-none">{Math.floor(detail.scores.milestone_points).toLocaleString()}</p>
              </div>
              <div className="w-16 h-16 rounded border border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-0.5">
                <p className="text-[9px] text-muted-foreground leading-none">Total</p>
                <p className="text-sm font-bold leading-none">{Math.floor(detail.scores.total).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading team...</p>}
      {isError && <p className="text-sm text-destructive">Failed to load team data.</p>}
      {detail && <FrenzyTeamDetail detail={detail} activeSection={activeSection} activeTier={activeTier} />}
    </div>
  );
}
