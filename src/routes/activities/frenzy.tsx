import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { registerPage } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useActiveEvent } from "@/hooks/useFrenzy";
import { FrenzyOverview } from "@/components/frenzy/FrenzyOverview";
import { FrenzyLeaderboard } from "@/components/frenzy/FrenzyLeaderboard";
import { FrenzyEventChartsSheet } from "@/components/frenzy/FrenzyEventChartsSheet";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

registerPage({
  id: "frenzy",
  label: "PVM Frenzy",
  description: "PVM Frenzy event dashboard.",
  defaults: {
    read: [],
    create: ["Foundry Mentors"],
    edit: ["Foundry Mentors"],
    delete: ["Senior Moderator"],
  },
});

export const frenzyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activities/frenzy",
  component: FrenzyPage,
});

function FrenzyPage() {
  const { user } = useAuth();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const { hasPermission } = usePermissions();
  const { data: activeEvent, isLoading } = useActiveEvent();

  const canManage = hasPermission("frenzy", "edit", effectiveRoles);

  return (
    <div className="mx-auto max-w-6xl w-full space-y-6 py-6 px-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-rs-bold text-4xl text-primary">PVM Frenzy</h1>
          <p className="text-sm text-muted-foreground mt-1">Team competition - collect items and earn points.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeEvent && <FrenzyEventChartsSheet eventName={activeEvent.name} />}
          {canManage && (
            <Button asChild size="sm" variant="outline">
              <Link to="/members/staff/frenzy">
                <Settings className="h-4 w-4 mr-1.5" />
                Manage Event
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading event...</p>}
      {!isLoading && !activeEvent && (
        <p className="text-sm text-muted-foreground">No active event right now. Check back later!</p>
      )}
      {activeEvent && <FrenzyOverview event={activeEvent} />}
      <FrenzyLeaderboard />
    </div>
  );
}
