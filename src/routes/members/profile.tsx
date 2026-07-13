import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { useAuth } from "@/context/AuthContext";
import { useMyBadges, useMeStats, useMyRankings } from "@/hooks/useMemberDashboard";
import { useQuery } from "@tanstack/react-query";
import { getAccounts } from "@/api/accounts";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { highestRoleDisplay, INGAME_TO_DISPLAY, ROLE_BADGE_CLASS } from "@/lib/ranks";
import { LinkedAccountsCard } from "@/components/profile/LinkedAccountsCard";
import { YearlyGoalsCard } from "@/components/profile/YearlyGoalsCard";
import { WomSnapshotCard } from "@/components/profile/WomSnapshotCard";
import { SkillsCard } from "@/components/profile/SkillsCard";
import { BallotTokensCard } from "@/components/profile/BallotTokensCard";
import type { PlayerBadge } from "@/types/members";

export const membersProfileRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "profile",
  component: ProfilePage,
});

function formatGp(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)         return `${Math.round(v / 1_000)}K`;
  return v.toLocaleString();
}

function ProfileHeaderCard(): React.JSX.Element | null {
  const { user } = useAuth();
  const { data: meStats }      = useMeStats(user?.rsn);
  const { data: rankings = [] } = useMyRankings(user?.discord_user_id);

  if (!user) return null;

  const topRole      = highestRoleDisplay(user.effective_roles, user.role_labels);
  const ingameDisplay = user.clan_rank ? (INGAME_TO_DISPLAY[user.clan_rank] ?? user.clan_rank) : null;
  const primary      = rankings.find((r) => r.is_primary);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img
              src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=80`}
              alt=""
              className="h-20 w-20 rounded-full shrink-0"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-muted shrink-0" />
          )}
          <div className="min-w-0 space-y-1">
            <h1 className="font-rs-bold text-3xl text-primary leading-tight truncate">
              {user.rsn ?? user.username}
            </h1>
            <p className="text-sm text-muted-foreground">{user.username}</p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {topRole && topRole in ROLE_BADGE_CLASS && (
                <Badge variant="outline" className={cn("text-xs", ROLE_BADGE_CLASS[topRole])}>
                  {topRole}
                </Badge>
              )}
              {ingameDisplay && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {ingameDisplay}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {meStats && meStats.collection_log_slots > 0 && (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Collection Log</p>
              <p className="text-sm font-semibold text-foreground">
                {meStats.collection_log_slots.toLocaleString()}
                {meStats.collection_log_slots_max > 0 && (
                  <span className="font-normal text-muted-foreground"> / {meStats.collection_log_slots_max.toLocaleString()}</span>
                )}
              </p>
            </div>
          )}
          {meStats && meStats.total_loot_value > 0 && (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Personal Loot</p>
              <p className="text-sm font-semibold text-foreground">{formatGp(meStats.total_loot_value)}</p>
            </div>
          )}
          {primary?.points != null && (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Ranking Points</p>
              <p className="text-sm font-rs-bold text-primary">{primary.points.toLocaleString()}</p>
            </div>
          )}
          {(primary?.rank ?? meStats?.rank_tier) && (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Rank Tier</p>
              <p className="text-sm font-semibold text-foreground">{primary?.rank ?? meStats?.rank_tier}</p>
            </div>
          )}
          {primary?.boss_points != null && (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Boss Points</p>
              <p className="text-sm font-semibold text-foreground">{primary.boss_points.toLocaleString()}</p>
            </div>
          )}
          {primary?.skill_points != null && (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Skill Points</p>
              <p className="text-sm font-semibold text-foreground">{primary.skill_points.toLocaleString()}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BadgesCard(): React.JSX.Element | null {
  const { user } = useAuth();
  const { data: badges = [] } = useMyBadges(user?.discord_user_id);

  if (badges.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-rs-bold text-xl text-primary">Badges</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {badges.map((b: PlayerBadge) => {
            const isSvg = b.icon?.trimStart().startsWith("<");
            const iconSrc = b.icon
              ? isSvg
                ? `data:image/svg+xml,${encodeURIComponent(b.icon)}`
                : b.icon
              : null;
            return (
              <span
                key={b.id}
                title={b.description}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                style={{ background: b.color, color: b.text_color }}
              >
                {iconSrc && (
                  <img src={iconSrc} alt="" className="h-4 w-4 shrink-0 object-contain" />
                )}
                {b.name}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
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
    <div className="space-y-6">
      <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-2.5 text-sm text-yellow-700 dark:text-yellow-400">
        Work in progress - goal tracking is still being developed.
      </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4">
        <ProfileHeaderCard />
        <LinkedAccountsCard />
        <BallotTokensCard />
        <WomSnapshotCard rsn={user.rsn} />
      </div>
      <div className="space-y-6 lg:col-span-8">
        {accounts.length > 0 && <SkillsCard accounts={accounts} />}
        {accounts.length > 0 && <YearlyGoalsCard accounts={accounts} />}
        <BadgesCard />
      </div>
    </div>
    </div>
  );
}
