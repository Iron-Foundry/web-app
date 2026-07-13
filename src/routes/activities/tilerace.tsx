import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { registerPage } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import {
  useActiveTileraceEvent,
  useCompletions,
  useSignUp,
  useCancelSignup,
} from "@/hooks/useTilerace";
import { TileBoard } from "@/components/tilerace/TileBoard";
import { TeamCard } from "@/components/tilerace/TeamCard";
import { DiceRoller } from "@/components/tilerace/DiceRoller";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";
import { buildPathPositionMap, formatTileRaceDate } from "@/lib/tilerace";

registerPage({
  id: "tilerace",
  label: "Tile Race",
  description: "Tile Race event dashboard.",
});

export const tileraceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activities/tilerace",
  component: TileRacePage,
});

function TileRacePage(): JSX.Element {
  const { user } = useAuth();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const { hasPermission } = usePermissions();
  const { data: event, isLoading } = useActiveTileraceEvent();
  const { mutate: signUp, isPending: signingUp } = useSignUp();
  const { mutate: cancelSignup, isPending: cancelling } = useCancelSignup();
  const { data: completions = [] } = useCompletions(user && event ? event.id : "");

  const canManage = hasPermission("tilerace", "edit", effectiveRoles);

  const daysLeft =
    event?.ends_at
      ? Math.max(0, Math.ceil((new Date(event.ends_at).getTime() - Date.now()) / 86_400_000))
      : null;

  const isSignedUp = user
    ? event?.signups.some((s) => s.discord_user_id === user.discord_user_id) ?? false
    : false;

  const isOnTeam = user
    ? event?.teams.some((t) =>
        t.members.some((m) => m.discord_user_id === user.discord_user_id),
      ) ?? false
    : false;

  const pathPositionMap = event ? buildPathPositionMap(event.cells) : new Map();

  return (
    <div className="mx-auto max-w-6xl w-full space-y-6 py-6 px-4">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Active Event
            </p>
            <h1 className="font-rs-bold text-4xl text-primary">
              {event?.name ?? "Tile Race"}
            </h1>
            {event?.ends_at && (
              <p className="text-sm text-muted-foreground">
                {event.starts_at
                  ? `${formatTileRaceDate(event.starts_at)} - ${formatTileRaceDate(event.ends_at)}`
                  : `Ends ${formatTileRaceDate(event.ends_at)}`}
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
              {user && event && !isOnTeam && !isSignedUp && (
                <Button size="sm" onClick={() => signUp(event.id)} disabled={signingUp}>
                  Sign Up
                </Button>
              )}
              {user && event && isSignedUp && !isOnTeam && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cancelSignup(event.id)}
                  disabled={cancelling}
                >
                  Cancel Signup
                </Button>
              )}
              {canManage && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/members" search={{ cp: "tilerace" }}>
                    <Settings className="h-4 w-4 mr-1.5" />
                    Manage
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading event...</p>}

      {!isLoading && !event && (
        <p className="text-sm text-muted-foreground">
          No active tile race right now. Check back later!
        </p>
      )}

      {event?.is_finished && (
        <div className="rounded-xl border border-primary/50 bg-primary/10 p-4 text-center">
          <p className="font-rs-bold text-2xl text-primary">Game Over</p>
          <p className="text-sm text-muted-foreground">
            {event.winner_team_id
              ? `${
                  event.teams.find((t) => t.id === event.winner_team_id)?.name ??
                  "A team"
                } reached the finish. Rolls are locked.`
              : "The finish was reached. Rolls are locked."}
          </p>
        </div>
      )}

      {event && (
        <>
          <TileBoard event={event} />

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.teams.map((team) => {
              const currentCell = pathPositionMap.get(team.position);
              const gated =
                !!currentCell?.tile_id &&
                !completions.some(
                  (c) => c.team_id === team.id && c.path_position === team.position,
                );
              return (
                <TeamCard key={team.id} team={team} currentCell={currentCell}>
                  {user && (
                    <DiceRoller
                      eventId={event.id}
                      team={team}
                      currentUserId={user.discord_user_id}
                      diceCount={event.dice_count}
                      diceSides={event.dice_sides}
                      gated={gated}
                      finished={event.is_finished}
                    />
                  )}
                </TeamCard>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
