import { createRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { rootRoute } from "../__root";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/layout/PageHead";
import { DraftPool } from "@/components/frenzy/draft/DraftPool";
import { RecentPicks } from "@/components/frenzy/draft/RecentPicks";
import { SnakeGrid } from "@/components/frenzy/draft/SnakeGrid";
import { DraftTeams } from "@/components/frenzy/draft/DraftTeams";
import { useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useActiveEvent } from "@/hooks/useFrenzy";
import { useFrenzyDraft, useFrenzyDraftSocket, usePickMember } from "@/hooks/useFrenzyDraft";
import { recentPicks, turnHeading } from "@/lib/frenzyDraft";
import { browserTimeZone } from "@/lib/timeZones";
import type { ViewerZone } from "@/components/frenzy/draft/ZoneOffset";
import type { DraftView } from "@/types/frenzyDraft";

export const frenzyDraftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activities/frenzy/draft",
  component: FrenzyDraftPage,
});

const toastError = (err: unknown): void => {
  toast.error(err instanceof Error ? err.message : "The pick could not be saved.");
};

/** "Pick" for the captain on turn, "Pick for (captain)" for staff, null for everyone else. */
function pickLabel(view: DraftView, viewerId: string | undefined, isStaff: boolean): string | null {
  if (view.state !== "picking") return null;
  const team = view.teams.find((t) => t.team_id === view.picking_team_id);
  if (!team) return null;
  if (viewerId === team.captain_discord_user_id) return "Pick";
  return isStaff ? `Pick for ${team.captain.rsn}` : null;
}

function FrenzyDraftPage(): React.ReactElement {
  const { user } = useAuth();
  const roles = useEffectiveRoles(user?.effective_roles ?? []);
  const isStaff = usePermissions().hasPermission("frenzy.admin", "edit", roles);
  const { data: event } = useActiveEvent();
  const { data: view, isLoading } = useFrenzyDraft(event?.id);
  useFrenzyDraftSocket(event?.id);
  const pick = usePickMember(event?.id ?? 0);

  const mode = view?.mode === "top_picks" ? "Top Picks" : "Full draft";
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/activities/frenzy">
          <ChevronLeft className="mr-1 h-4 w-4" />
          PVM Frenzy
        </Link>
      </Button>
      <PageHead title={event?.name ?? "PVM Frenzy"}>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          PVM Frenzy draft{view ? ` · ${mode}` : ""}
          {view?.state === "picking" && <span className="ml-3 font-semibold normal-case text-mk-green">● Live</span>}
        </p>
      </PageHead>
      {isLoading && <p className="text-sm text-muted-foreground">Loading the draft...</p>}
      {!isLoading && !view && <p className="text-sm text-muted-foreground">This event has no draft.</p>}
      {view && (
        <DraftBody
          view={view}
          label={pickLabel(view, user?.discord_user_id, isStaff)}
          isStaff={isStaff}
          viewer={user ? { zone: browserTimeZone(), at: new Date() } : null}
          busy={pick.isPending}
          onPick={(signupId) => pick.mutate({ signupId, pick: view.next_pick }, { onError: toastError })}
        />
      )}
    </div>
  );
}

interface BodyProps {
  view: DraftView;
  label: string | null;
  isStaff: boolean;
  viewer: ViewerZone;
  busy: boolean;
  onPick: (signupId: number) => void;
}

function DraftBody({ view, label, isStaff, viewer, busy, onPick }: BodyProps): React.ReactElement {
  const heading = turnHeading(view);
  const signupCount = view.pool.length + view.teams.reduce((sum, t) => sum + t.members.length + 1, 0);
  return (
    <>
      <section className="rounded-xl border border-border bg-card p-5" aria-label="Current pick">
        <p className="font-rs-bold text-2xl text-primary">{heading.title}</p>
        <p className="text-mk-body">{heading.detail}</p>
      </section>
      {view.teams.length > 0 && <SnakeGrid view={view} viewer={viewer} />}
      {view.state !== "complete" && (
        <div className="grid gap-5 lg:grid-cols-main-side">
          <DraftPool pool={view.pool} signupCount={signupCount} pickLabel={label} busy={busy} viewer={viewer} onPick={(m) => onPick(m.signup_id)} />
          <RecentPicks picks={recentPicks(view, 10)} />
        </div>
      )}
      {view.teams.length > 0 && <DraftTeams view={view} isStaff={isStaff} signupCount={signupCount} viewer={viewer} />}
    </>
  );
}
