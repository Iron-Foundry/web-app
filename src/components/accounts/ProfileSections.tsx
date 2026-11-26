import { BadgeIcon } from "@/components/badges/badgeHoverCard";
import type { PlayerProfile } from "@/types/leaderboard";

/** The sections of an account hover card, each drawn from the player's profile. */

function formatGp(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return v.toLocaleString();
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function ProfileHeader({ profile }: { profile: PlayerProfile }): React.JSX.Element {
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

export function ProfileRankings({ accounts }: { accounts: PlayerProfile["accounts"] }): React.JSX.Element | null {
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

export function ProfileBadges({ badges }: { badges: PlayerProfile["badges"] }): React.JSX.Element | null {
  if (badges.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Badges</p>
      <div className="flex flex-wrap gap-1.5">
        {badges.map((b) => (
          <span
            key={b.id}
            title={b.description}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
            style={{ background: b.color, color: b.text_color }}
          >
            {b.icon && <BadgeIcon icon={b.icon} textColor={b.text_color} className="h-3 w-3 shrink-0" />}
            {b.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProfileLatestAchievement({ achievement }: { achievement: PlayerProfile["latest_achievement"] }): React.JSX.Element | null {
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

export function ProfileFooter({ profile }: { profile: PlayerProfile }): React.JSX.Element | null {
  if (profile.total_loot_value <= 0 && profile.collection_log_slots_max <= 0) return null;
  return (
    <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
      <span className="text-muted-foreground">
        Loot: <span className="font-medium text-foreground">{formatGp(profile.total_loot_value)}</span>
      </span>
      {profile.collection_log_slots_max > 0 && (
        <span className="text-muted-foreground">
          Clog: <span className="font-medium text-foreground">{profile.collection_log_slots}/{profile.collection_log_slots_max}</span>
        </span>
      )}
    </div>
  );
}
