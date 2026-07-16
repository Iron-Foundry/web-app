import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { registerPage } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useControlPanel } from "@/context/ControlPanelContext";
import { useActiveEvent } from "@/hooks/useFrenzy";
import { FrenzyOverview } from "@/components/frenzy/FrenzyOverview";
import { FrenzyLeaderboard } from "@/components/frenzy/FrenzyLeaderboard";
import { FrenzyEventChartsSheet } from "@/components/frenzy/FrenzyEventChartsSheet";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

registerPage({
  id: "frenzy",
  label: "PVM Frenzy",
  description: "PVM Frenzy event dashboard.",
});

export const frenzyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activities/frenzy",
  component: FrenzyPage,
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FrenzyPage() {
  const { user } = useAuth();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const { hasPermission } = usePermissions();
  const { openPanel } = useControlPanel();
  const { data: activeEvent, isLoading } = useActiveEvent();

  const canManage = hasPermission("frenzy", "edit", effectiveRoles);

  const daysLeft =
    activeEvent?.ends_at
      ? Math.max(0, Math.ceil((new Date(activeEvent.ends_at).getTime() - Date.now()) / 86_400_000))
      : null;

  return (
    <div className="mx-auto max-w-6xl w-full space-y-6 py-6 px-4">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Active Event
            </p>
            <h1 className="font-rs-bold text-4xl text-primary">
              {activeEvent?.name ?? "PVM Frenzy"}
            </h1>
            {activeEvent?.ends_at && (
              <p className="text-sm text-muted-foreground">
                {activeEvent.starts_at
                  ? `${formatDate(activeEvent.starts_at)} - ${formatDate(activeEvent.ends_at)}`
                  : `Ends ${formatDate(activeEvent.ends_at)}`}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {daysLeft !== null && (
              <Badge variant={daysLeft <= 3 ? "destructive" : "secondary"}>
                {daysLeft === 0 ? "Ends today" : `${daysLeft}d remaining`}
              </Badge>
            )}
            <div className="flex items-center gap-2">
              {activeEvent && <FrenzyEventChartsSheet eventName={activeEvent.name} />}
              {canManage && (
                <Button size="sm" variant="outline" onClick={() => openPanel("frenzy")}>
                  <Settings className="h-4 w-4 mr-1.5" />
                  Manage
                </Button>
              )}
            </div>
          </div>
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
