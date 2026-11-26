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
  useTileraceRecap,
} from "@/hooks/useTilerace";
import { useRollAnimations } from "@/hooks/useRollAnimations";
import { useBoardRedraw } from "@/hooks/useBoardRedraw";
import { getAccounts } from "@/api/accounts";
import { TileBoard } from "@/components/tilerace/TileBoard";
import { BoardProgressBar } from "@/components/tilerace/BoardProgressBar";
import { EventRecap } from "@/components/tilerace/recap/EventRecap";
import { CollapsedRecap } from "@/components/tilerace/recap/CollapsedRecap";
import { SignupPanel } from "@/components/events/SignupPanel";
import { TileRaceHeader } from "@/components/tilerace/TileRaceHeader";
import { TeamGrid } from "@/components/tilerace/TeamGrid";

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
  const ended =
    !!event &&
    (!event.is_active ||
      event.is_finished ||
      (!!event.ends_at && new Date(event.ends_at).getTime() < Date.now()));
  const { data: recap } = useTileraceRecap(ended && event ? event.id : "");
  const nextScheduled = !!recap?.next_event;
  const fullRecap = ended && !!recap && !nextScheduled;
  const showBoard = !fullRecap;

  const { data: completions = [] } = useCompletions(user && event ? event.id : "");
  const { data: rolls = [] } = useRecentRolls(event ? event.id : "", !ended);
  const rollingTeamIds = useRollAnimations(ended ? [] : rolls);
  useBoardRedraw(event && !ended ? event.id : "", rolls);

  const canManage = hasPermission("tilerace.admin", "edit", effectiveRoles);

  const daysLeft =
    !ended && event?.ends_at
      ? Math.max(0, Math.ceil((new Date(event.ends_at).getTime() - Date.now()) / 86_400_000))
      : null;

  const mySignup = event?.my_signup ?? null;
  const isSignedUp = !!mySignup;
  const isOnTeam = !!event?.my_team_id;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 py-6">
      <TileRaceHeader
        name={event?.name ?? "Tile Race"}
        ended={ended}
        startsAt={event?.starts_at}
        endsAt={event?.ends_at}
        rollsPaused={!!event?.rolls_paused}
        nextEvent={recap?.next_event}
        daysLeft={daysLeft}
        onManage={canManage ? () => openPanel("tilerace") : null}
        signup={user && event && !isOnTeam && (
          <SignupPanel
            open={event.signups_open}
            accounts={accounts}
            signedUp={isSignedUp}
            currentAccountId={mySignup?.account_id ?? null}
            wantsCaptain={mySignup?.wants_captain ?? false}
            busy={signingUp || changing || cancelling}
            onSignUp={(accountId, wantsCaptain) => signUp({ eventId: event.id, accountId, wantsCaptain })}
            onChange={(accountId, wantsCaptain) => changeSignup({ eventId: event.id, accountId, wantsCaptain })}
            onRescind={() => cancelSignup(event.id)}
          />
        )}
      />

      {isLoading && <p className="text-sm text-muted-foreground">Loading event...</p>}

      {!isLoading && !event && (
        <p className="text-sm text-muted-foreground">
          No active tile race right now. Check back later!
        </p>
      )}

      {event?.is_finished && !fullRecap && (
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="font-rs-bold text-3xl text-mark">Game Over</p>
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

      {event && showBoard && (
        <>
          <BoardProgressBar event={event} />

          <TileBoard event={event} rollingTeamIds={rollingTeamIds} />

          <TeamGrid event={event} completions={completions} rolls={rolls} rollingTeamIds={rollingTeamIds} signedIn={!!user} />
        </>
      )}

      {fullRecap && recap && <EventRecap recap={recap} />}

      {ended && recap && nextScheduled && <CollapsedRecap recap={recap} />}
    </div>
  );
}
