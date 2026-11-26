import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { useAuth } from "@/context/AuthContext";
import { useMyBadges, useMeStats, useMyRankings } from "@/hooks/useMemberDashboard";
import { useQuery } from "@tanstack/react-query";
import { getAccounts } from "@/api/accounts";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import { highestRoleDisplay, INGAME_TO_DISPLAY, ROLE_BADGE_CLASS } from "@/lib/ranks";
import { LinkedAccountsCard } from "@/components/profile/LinkedAccountsCard";
import { YearlyGoalsCard } from "@/components/profile/YearlyGoalsCard";
import { WomSnapshotCard } from "@/components/profile/WomSnapshotCard";
import { SkillsCard } from "@/components/profile/SkillsCard";
import { BallotTokensCard } from "@/components/profile/BallotTokensCard";
import { BadgeHoverCard } from "@/components/badges/badgeHoverCard";
import { FactStrip } from "@/components/members/FactStrip";
import { profileFacts } from "@/components/members/memberFacts";
import { Panel } from "@/components/members/Panel";

export const membersProfileRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "profile",
  component: ProfilePage,
});

function ProfileHead(): React.JSX.Element | null {
  const { user } = useAuth();
  const { data: meStats } = useMeStats(user?.rsn);
  const { data: rankings = [] } = useMyRankings(user?.discord_user_id);
  if (!user) return null;

  const topRole = highestRoleDisplay(user.effective_roles, user.role_labels);
  const ingame = user.clan_rank ? (INGAME_TO_DISPLAY[user.clan_rank] ?? user.clan_rank) : null;

  return (
    <>
      <div className="flex items-center gap-5">
        {user.avatar ? (
          <img src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=80`} alt={`${user.username} avatar`} className="h-20 w-20 shrink-0 rounded-full" />
        ) : (
          <div className="h-20 w-20 shrink-0 rounded-full bg-muted" />
        )}
        <div className="min-w-0 space-y-1">
          <h1 className="truncate font-rs-bold text-4xl leading-tight text-mark">{user.rsn ?? user.username}</h1>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{user.username}</span>
            {topRole && topRole in ROLE_BADGE_CLASS && <span className={cn("font-medium", ROLE_BADGE_CLASS[topRole])}>{topRole}</span>}
            {ingame && <span>{ingame}</span>}
          </p>
        </div>
      </div>
      <FactStrip facts={profileFacts(meStats, rankings.find((r) => r.is_primary))} />
    </>
  );
}

function BadgesPanel(): React.JSX.Element | null {
  const { user } = useAuth();
  const { data: badges = [] } = useMyBadges(user?.discord_user_id);
  if (badges.length === 0) return null;
  return (
    <Panel title="Badges">
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => <BadgeHoverCard key={b.id} badge={b} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium cursor-default" />)}
      </div>
    </Panel>
  );
}

function ProfilePage(): React.JSX.Element | null {
  const { user } = useAuth();
  const { data: accounts = [] } = useQuery({
    queryKey: queryKeys.members.accounts(),
    queryFn: getAccounts,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
  if (!user) return null;

  return (
    <div className="space-y-8">
      <p className="rounded-lg border border-mk-yellow/35 bg-mk-yellow/10 px-4 py-2.5 text-sm">
        Work in progress - goal tracking is still being developed.
      </p>
      <ProfileHead />
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-side-main">
        <div className="grid min-w-0 gap-5">
          <LinkedAccountsCard />
          <BallotTokensCard />
          <WomSnapshotCard rsn={user.rsn} />
        </div>
        <div className="grid min-w-0 gap-5">
          {accounts.length > 0 && <SkillsCard accounts={accounts} />}
          {accounts.length > 0 && <YearlyGoalsCard accounts={accounts} />}
          <BadgesPanel />
        </div>
      </div>
    </div>
  );
}
