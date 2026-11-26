import { useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { highestRoleDisplay, ROLE_BADGE_CLASS } from "@/lib/ranks";
import { cn } from "@/lib/utils";
import { useMyBadges, useMyFeed, useNameChanges, useDashboardCompetitions, useMeStats, useMyRankings } from "@/hooks/useMemberDashboard";
import { MemberDashboardSkeleton } from "@/components/skeletons/MemberDashboardSkeleton";
import { ActivityFeedSheet } from "@/components/members/ActivityFeedSheet";
import { NameChangesSheet } from "@/components/members/NameChangesSheet";
import { CompetitionsSheet } from "@/components/members/CompetitionsSheet";
import { FactStrip } from "@/components/members/FactStrip";
import { dashboardFacts } from "@/components/members/memberFacts";
import { DashboardFeed } from "@/components/members/DashboardFeed";
import { DashboardCompetitions } from "@/components/members/DashboardCompetitions";
import { AccountRanksPanel, BadgesPanel, NameChangesPanel } from "@/components/members/DashboardSidePanels";

export const membersDashboardRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/",
  component: DashboardPage,
});

function DashboardHead({ user, topRole }: { user: AuthUser; topRole: string | null }): React.ReactElement {
  return (
    <div className="flex items-center gap-5">
      {user.avatar ? (
        <img src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=80`} alt={`${user.username} avatar`} className="h-16 w-16 shrink-0 rounded-full" />
      ) : (
        <div className="h-16 w-16 shrink-0 rounded-full bg-muted" />
      )}
      <div className="min-w-0 space-y-1">
        <h1 className="font-rs-bold text-4xl leading-tight text-mark">Welcome, {user.rsn ?? user.username}!</h1>
        {topRole && topRole in ROLE_BADGE_CLASS && <p className={cn("text-sm font-medium", ROLE_BADGE_CLASS[topRole])}>{topRole}</p>}
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user, loading } = useAuth();
  const { data: playerBadges = [] } = useMyBadges(user?.discord_user_id);
  const { data: feed = [], isLoading: feedLoading } = useMyFeed(user?.rsn);
  const { data: meStats } = useMeStats(user?.rsn);
  const { data: rankings = [] } = useMyRankings(user?.discord_user_id);
  const { data: nameChanges = [], isLoading: nameChangesLoading } = useNameChanges();
  const { data: competitions = [], isLoading: compsLoading } = useDashboardCompetitions();
  const [sheet, setSheet] = useState<"feed" | "names" | "comps" | null>(null);

  if (loading) return <MemberDashboardSkeleton />;
  if (!user) return null;

  const topRole = highestRoleDisplay(user.effective_roles, user.role_labels);
  const closeTo = (open: boolean): void => { if (!open) setSheet(null); };

  return (
    <div className="space-y-8">
      <DashboardHead user={user} topRole={topRole} />
      {!user.rsn && (
        <p className="rounded-lg border border-mk-yellow/35 bg-mk-yellow/10 px-4 py-2.5 text-sm">
          Link your RSN in <Link to="/members/settings" className="font-medium underline">Settings</Link> to unlock your activity feed.
        </p>
      )}
      <FactStrip facts={dashboardFacts(user, meStats, topRole)} />

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-side-feed xl:grid-cols-side-feed-side">
        <div className="grid min-w-0 gap-5">
          <AccountRanksPanel rankings={rankings} />
          <BadgesPanel badges={playerBadges} />
          <NameChangesPanel nameChanges={nameChanges} loading={nameChangesLoading} onShowAll={() => setSheet("names")} />
        </div>
        <DashboardFeed feed={feed} hasRsn={!!user.rsn} loading={feedLoading} onShowAll={() => setSheet("feed")} />
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <DashboardCompetitions competitions={competitions} loading={compsLoading} onShowAll={() => setSheet("comps")} />
        </div>
      </div>

      <ActivityFeedSheet open={sheet === "feed"} onOpenChange={closeTo} feed={feed} />
      <NameChangesSheet open={sheet === "names"} onOpenChange={closeTo} nameChanges={nameChanges} />
      <CompetitionsSheet open={sheet === "comps"} onOpenChange={closeTo} competitions={competitions} />
    </div>
  );
}
