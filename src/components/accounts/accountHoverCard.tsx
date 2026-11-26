import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { leaderboardsApi } from "@/api/leaderboards";
import { queryKeys } from "@/lib/queryKeys";
import type { PlayerProfile } from "@/types/leaderboard";

import { ProfileBadges, ProfileFooter, ProfileHeader, ProfileLatestAchievement, ProfileRankings } from "./ProfileSections";
/**
 * Hover card shown for any listed account (leaderboards, competitions, rankings, ...).
 *
 * Content is built from small section components, each taking the full `PlayerProfile`.
 * To add a new section in the future: add a `Profile*` component below and render it
 * in `AccountHoverCard`'s content (gated behind `stats_opt_out` if it exposes stats).
 */

interface AccountHoverCardProps {
  rsn: string;
  children: React.ReactNode;
  className?: string;
}

export function AccountHoverCard({ rsn, children, className }: AccountHoverCardProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.ranking.profile(rsn),
    queryFn: () => leaderboardsApi.getPlayerProfile(rsn),
    enabled: open,
    staleTime: 1000 * 60,
    retry: false,
  });

  return (
    <HoverCard openDelay={200} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <span className={className}>{children}</span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 rounded-xl border-0 bg-transparent p-0 shadow-none">
        <div className="space-y-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-md">
          {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
          {!isLoading && !profile && <p className="text-xs text-muted-foreground">No profile data available.</p>}
          {profile && (
            <>
              <ProfileHeader profile={profile} />
              {profile.stats_opt_out ? (
                <p className="text-xs italic text-muted-foreground">This member has opted out of public stats.</p>
              ) : (
                <>
                  <ProfileRankings accounts={profile.accounts} />
                  <ProfileBadges badges={profile.badges} />
                  <ProfileLatestAchievement achievement={profile.latest_achievement} />
                  <ProfileFooter profile={profile} />
                </>
              )}
            </>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
