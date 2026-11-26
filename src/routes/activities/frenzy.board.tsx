import { createRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { rootRoute } from "../__root";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/layout/PageHead";
import { FrenzyEventBoard } from "@/components/frenzy/FrenzyEventBoard";
import { useActiveEvent } from "@/hooks/useFrenzy";

export const frenzyBoardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activities/frenzy/board",
  component: FrenzyBoardPage,
});

function FrenzyBoardPage(): React.ReactElement {
  const { data: event, isLoading } = useActiveEvent();
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/activities/frenzy">
          <ChevronLeft className="mr-1 h-4 w-4" />
          PVM Frenzy
        </Link>
      </Button>
      <PageHead title={event?.name ?? "PVM Frenzy"}>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">PVM Frenzy board</p>
      </PageHead>
      {isLoading && <p className="text-sm text-muted-foreground">Loading event...</p>}
      {!isLoading && !event && <p className="text-sm text-muted-foreground">No active event right now.</p>}
      {event && <FrenzyEventBoard />}
    </div>
  );
}
