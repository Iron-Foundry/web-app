import { createRoute, Link, useParams } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { rootRoute } from "../__root";
import { Button } from "@/components/ui/button";
import { FrenzyTeamHeader } from "@/components/frenzy/FrenzyTeamHeader";
import { FrenzyTeamSections } from "@/components/frenzy/FrenzyTeamSections";
import { useActiveEvent, useTeamDetail } from "@/hooks/useFrenzy";

export const frenzyTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activities/frenzy/$teamSlug",
  component: FrenzyTeamPage,
});

function FrenzyTeamPage(): React.ReactElement {
  const { teamSlug } = useParams({ from: "/activities/frenzy/$teamSlug" });
  const { data: detail, isLoading, isError } = useTeamDetail(teamSlug);
  const { data: activeEvent } = useActiveEvent();
  const ranked = [...(activeEvent?.teams ?? [])].sort((a, b) => b.total_points - a.total_points);
  const index = ranked.findIndex((t) => t.slug === teamSlug);

  return (
    <div className="mx-auto max-w-6xl w-full space-y-4 py-6 px-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link to="/activities/frenzy">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {activeEvent?.name ?? "Back"}
        </Link>
      </Button>

      {isLoading && <p className="text-sm text-muted-foreground">Loading team...</p>}
      {isError && <p className="text-sm text-destructive">Failed to load team data.</p>}

      {detail && (
        <>
          <FrenzyTeamHeader detail={detail} place={index >= 0 ? index + 1 : null} teamCount={ranked.length} />
          <FrenzyTeamSections detail={detail} teamSlug={teamSlug} />
        </>
      )}
    </div>
  );
}
