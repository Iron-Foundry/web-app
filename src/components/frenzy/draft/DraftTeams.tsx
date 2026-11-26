import { toast } from "sonner";
import { useMoveMember } from "@/hooks/useFrenzyDraft";
import type { DraftView } from "@/types/frenzyDraft";
import { TeamRoster } from "./TeamRoster";
import type { ViewerZone } from "./ZoneOffset";

interface Props {
  view: DraftView;
  isStaff: boolean;
  signupCount: number;
  viewer: ViewerZone;
}

const toastError = (err: unknown): void => {
  toast.error(err instanceof Error ? err.message : "The member could not be moved.");
};

/** Every team's full roster side by side; staff move members once the draft is complete. */
export function DraftTeams({ view, isStaff, signupCount, viewer }: Props): React.ReactElement {
  const move = useMoveMember(view.event_id);
  const target = Math.ceil(signupCount / view.teams.length);
  const canMove = isStaff && view.state === "complete";
  return (
    <section className="space-y-3">
      <h2 className="font-rs-bold text-2xl text-foreground">Teams</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.teams.map((team) => (
          <TeamRoster
            key={team.team_id}
            team={team}
            target={target}
            pickingNow={view.state === "picking" && view.picking_team_id === team.team_id ? view.next_pick : null}
            moveTargets={canMove ? view.teams.filter((t) => t.team_id !== team.team_id) : null}
            viewer={viewer}
            onMove={(member, teamId) => move.mutate({ signupId: member.signup_id, teamId }, { onError: toastError })}
          />
        ))}
      </div>
    </section>
  );
}
