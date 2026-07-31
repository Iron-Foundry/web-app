import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { registerPage } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { useControlPanel } from "@/context/ControlPanelContext";
import { useQuery } from "@tanstack/react-query";
import {
  useActiveTileraceEvent,
  useCompletions,
  useRecentRolls,
  useSignUp,
  useChangeSignup,
  useCancelSignup,
} from "@/hooks/useTilerace";
import { useRollAnimations } from "@/hooks/useRollAnimations";
import { getAccounts } from "@/api/accounts";
import { TileBoard } from "@/components/tilerace/TileBoard";
import { TeamCard } from "@/components/tilerace/TeamCard";
import { DiceRoller } from "@/components/tilerace/DiceRoller";
import { RecentRollsPanel } from "@/components/tilerace/RecentRollsPanel";
import { SignupPanel } from "@/components/events/SignupPanel";
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
  const { openPanel } = useControlPanel();
  const { data: event, isLoading } = useActiveTileraceEvent();
  const { mutate: signUp, isPending: signingUp } = useSignUp();
  const { mutate: changeSignup, isPending: changing } = useChangeSignup();
  const { mutate: cancelSignup, isPending: cancelling } = useCancelSignup();
  const { data: accounts = [] } = useQuery({
    queryKey: ["members", "accounts"],
    queryFn: getAccounts,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
  const { data: completions = [] } = useCompletions(user && event ? event.id : "");
  const { data: rolls = [] } = useRecentRolls(event ? event.id : "");
  const rollingTeamIds = useRollAnimations(rolls);

  const canManage = hasPermission("tilerace", "edit", effectiveRoles);

  const daysLeft =
    event?.ends_at
      ? Math.max(0, Math.ceil((new Date(event.ends_at).getTime() - Date.now()) / 86_400_000))
      : null;

  const mySignup = user
    ? event?.signups.find((s) => s.discord_user_id === user.discord_user_id)
    : undefined;
  const isSignedUp = !!mySignup;

  const isOnTeam = user
    ? event?.teams.some((t) =>
        t.members.some((m) => m.discord_user_id === user.discord_user_id),
      ) ?? false
    : false;

  const pathPositionMap = event ? buildPathPositionMap(event.cells) : new Map();

  return (
    <div className="mx-auto max-w-6xl xl:max-w-[88rem] w-full space-y-6 py-6 px-4">
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
              {user && event && !isOnTeam && (
                <SignupPanel
                  open={event.signups_open}
                  accounts={accounts}
                  signedUp={isSignedUp}
                  currentAccountId={mySignup?.account_id ?? null}
                  wantsCaptain={mySignup?.wants_captain ?? false}
                  busy={signingUp || changing || cancelling}
                  onSignUp={(accountId, wantsCaptain) =>
                    signUp({ eventId: event.id, accountId, wantsCaptain })
                  }
                  onChange={(accountId, wantsCaptain) =>
                    changeSignup({ eventId: event.id, accountId, wantsCaptain })
                  }
                  onRescind={() => cancelSignup(event.id)}
                />
              )}
              {canManage && (
                <Button size="sm" variant="outline" onClick={() => openPanel("tilerace")}>
                  <Settings className="h-4 w-4 mr-1.5" />
                  Manage
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
          <TileBoard event={event} rollingTeamIds={rollingTeamIds} />

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {event.teams.map((team) => {
                const currentCell = pathPositionMap.get(team.position);
                const gated =
                  !!currentCell?.tile_id &&
                  !completions.some(
                    (c) => c.team_id === team.id && c.path_position === team.position,
                  );
                return (
                  <TeamCard
                    key={team.id}
                    team={team}
                    currentCell={currentCell}
                    isRolling={rollingTeamIds.has(team.id)}
                  >
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

            <RecentRollsPanel rolls={rolls} teams={event.teams} />
          </div>
        </>
      )}
    </div>
  );
}
