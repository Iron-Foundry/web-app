import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { shineHandlers } from "@/hooks/useShineEffect";
import { leaderboardsApi } from "@/api/leaderboards";
import { queryKeys } from "@/lib/queryKeys";
import type { PlayerProfile } from "@/types/leaderboard";

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

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function ProfileHeader({ profile }: { profile: PlayerProfile }): React.JSX.Element {
  const joined = formatDate(profile.join_date);
  return (
    <div className="flex items-center gap-3">
      {profile.discord_avatar_url ? (
        <img src={profile.discord_avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{profile.discord_username ?? profile.rsn}</p>
        <p className="truncate text-xs text-muted-foreground">{joined ? `Joined ${joined}` : "Join date unknown"}</p>
      </div>
    </div>
  );
}

function ProfileRankings({ accounts }: { accounts: PlayerProfile["accounts"] }): React.JSX.Element | null {
  if (accounts.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Rankings</p>
      <ul className="space-y-0.5">
        {accounts.map((a) => (
          <li key={a.rsn} className="flex items-center justify-between text-xs">
            <span className="truncate font-medium text-foreground">{a.rsn}</span>
            <span className="shrink-0 text-muted-foreground">{a.rank} - {a.points.toLocaleString()} pts</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfileBadges({ badges }: { badges: PlayerProfile["badges"] }): React.JSX.Element | null {
  if (badges.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Badges</p>
      <div className="flex flex-wrap gap-1.5">
        {badges.map((b) => (
          <span
            key={b.id}
            title={b.description}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ background: b.color, color: b.text_color }}
          >
            {b.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfileLatestAchievement({ achievement }: { achievement: PlayerProfile["latest_achievement"] }): React.JSX.Element | null {
  if (!achievement) return null;
  const when = formatDate(achievement.timestamp);
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Latest achievement</p>
      <p className="text-xs text-foreground">
        {achievement.label}
        {achievement.detail && <span className="text-muted-foreground"> - {achievement.detail}</span>}
      </p>
      {when && <p className="text-[11px] text-muted-foreground/70">{when}</p>}
    </div>
  );
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
      <HoverCardContent
        className="shine-border w-80 rounded-xl border-0 bg-transparent p-0 shadow-none"
        {...shineHandlers}
      >
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
                </>
              )}
            </>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
