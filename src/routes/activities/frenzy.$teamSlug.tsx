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

const PARTICIPANT_PREVIEW = 12;

function ParticipantChips({ participants }: { participants: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? participants : participants.slice(0, PARTICIPANT_PREVIEW);
  const hidden = participants.length - PARTICIPANT_PREVIEW;

  return (
    <div className="flex flex-wrap gap-0.5 mt-1">
      {visible.map((rsn) => (
        <span key={rsn} className="text-[10px] bg-primary/15 text-primary px-1.5 py-px rounded-full font-medium">
          {rsn}
        </span>
      ))}
      {!expanded && hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs bg-muted/60 text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-full transition-colors"
        >
          +{hidden} more
        </button>
      )}
      {expanded && participants.length > PARTICIPANT_PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs bg-muted/60 text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-full transition-colors"
        >
          show less
        </button>
      )}
    </div>
  );
}

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
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link to="/activities/frenzy">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </Button>

      {isLoading && <p className="text-sm text-muted-foreground">Loading team...</p>}
      {isError && <p className="text-sm text-destructive">Failed to load team data.</p>}

      {detail && (
        <>
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-start gap-4 flex-wrap justify-between">
              <div className="flex items-center gap-4">
                {detail.icon_url ? (
                  <img
                    src={detail.icon_url}
                    alt={detail.name}
                    className="h-16 w-16 rounded object-contain shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded bg-muted shrink-0" />
                )}
                <div>
                  <h1 className="font-rs-bold text-3xl text-primary">{detail.name}</h1>
                  {detail.participants.length > 0 && (
                    <ParticipantChips participants={detail.participants} />
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <FrenzyChartsSheet
                  teamSlug={teamSlug}
                  teamName={detail.name}
                  participants={detail.participants}
                />
                <div className="text-right">
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <span className="text-3xl font-bold">
                      {Math.floor(detail.scores.total).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">pts</span>
                  </div>
                  {detail.pending_points > 0 && (
                    <p className="text-xs text-muted-foreground/60">
                      +{Math.floor(detail.pending_points).toLocaleString()} pending
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(detail.scores.tier_points).map(([tier, pts]) => (
              <div key={tier} className="rounded-lg border bg-card p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{tier} Tier</p>
                <p className="text-base font-bold mt-0.5">{Math.floor(pts).toLocaleString()}</p>
              </div>
            ))}
            <div className="rounded-lg border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Activities</p>
              <p className="text-base font-bold mt-0.5">
                {Math.floor(detail.scores.activity_points).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Milestones</p>
              <p className="text-base font-bold mt-0.5">
                {Math.floor(detail.scores.milestone_points).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex border-b border-border">
            {FRENZY_SECTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setActiveSection(s as FrenzySection)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeSection === s
                    ? "text-primary border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
                {s === "Multipliers" && unlockedMultsCount > 0 && (
                  <Badge variant="default" className="ml-1.5 text-xs">
                    {unlockedMultsCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>

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
                const obtained = sources.reduce(
                  (n, src) =>
                    n +
                    src.items.filter((item) => {
                      const key = `${t}.${src.name}.${item.name}`;
                      return (detail.progress.item_progress[key] ?? 0) >= item.required;
                    }).length,
                  0,
                );
                return (
                  <ToggleGroupItem
                    key={t}
                    value={t}
                    className="text-sm border border-border data-[state=on]:border-primary"
                  >
                    {t}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {obtained}/{total}
                    </span>
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          )}

          <FrenzyTeamDetail detail={detail} activeSection={activeSection} activeTier={activeTier} />
        </>
      )}
    </div>
  );
}
