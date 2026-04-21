import { useEffect, useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { useAuth, API_URL, getAuthToken } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { highestRoleDisplay, getDisplayRank } from "@/lib/ranks";
import { usePermissions } from "@/context/PermissionsContext";
import { cn } from "@/lib/utils";
import {
  Gem, TrendingUp, Zap, ScrollText, Map, Swords,
  Heart, BookOpen, FileSearch, Skull, Timer, Flame, KeyRound,
} from "lucide-react";

// Keyed by role label (display name) for badge styling
const ROLE_BADGE_CLASS: Record<string, string> = {
  "Co-owner":         "border-amber-500/60  text-amber-600  dark:text-amber-400",
  "Deputy Owner":     "border-amber-500/60  text-amber-600  dark:text-amber-400",
  "Senior Moderator": "border-red-400/60    text-red-600    dark:text-red-400",
  "Moderator":        "border-orange-400/60 text-orange-600 dark:text-orange-400",
  "Event Team":       "border-green-500/60  text-green-700  dark:text-green-400",
  "Foundry Mentors":  "border-blue-400/60   text-blue-600   dark:text-blue-400",
};

const WIKI = "https://oldschool.runescape.wiki/images";

function wikiIconUrl(type: string, label: string): string | null {
  const slug = label.replace(/ /g, "_");
  switch (type) {
    case "drop":
    case "clue":
    case "loot_key":
      return `${WIKI}/${slug}.png`;
    case "level":
      return label === "Total Level"
        ? `${WIKI}/Stats_icon.png`
        : `${WIKI}/${slug}_icon.png`;
    case "xp_milestone":
      return `${WIKI}/${slug}_icon.png`;
    case "quest":
      return `${WIKI}/${slug}_reward_scroll.png`;
    case "collection_log":
      return `${WIKI}/${slug}_detail.png`;
    default:
      return null;
  }
}

function FeedIcon({
  type,
  label,
  Fallback,
  className,
}: {
  type: string;
  label: string;
  Fallback: React.ElementType;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = wikiIconUrl(type, label);
  if (failed || !url) return <Fallback className={className} />;
  return (
    <img
      src={url}
      alt=""
      className="h-4 w-4 shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export const membersDashboardRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/",
  component: DashboardPage,
});

interface PlayerBadge {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  color: string;
  text_color: string;
}

interface FeedItem {
  type: string;
  timestamp: string;
  label: string;
  detail: string | null;
  value: number | null;
}

const FEED_META: Record<string, { icon: React.ElementType; color: string; badge: string }> = {
  drop:               { icon: Gem,        color: "text-yellow-400", badge: "Drop"         },
  level:              { icon: TrendingUp, color: "text-green-400",  badge: "Level Up"     },
  xp_milestone:       { icon: Zap,        color: "text-blue-400",   badge: "XP"           },
  quest:              { icon: ScrollText, color: "text-amber-400",  badge: "Quest"        },
  diary:              { icon: Map,        color: "text-orange-400", badge: "Diary"        },
  combat_achievement: { icon: Swords,     color: "text-red-400",    badge: "Combat"       },
  pet:                { icon: Heart,      color: "text-pink-400",   badge: "Pet"          },
  collection_log:     { icon: BookOpen,   color: "text-purple-400", badge: "Log"          },
  clue:               { icon: FileSearch, color: "text-teal-400",   badge: "Clue"         },
  pk:                 { icon: Skull,      color: "text-red-500",    badge: "PK"           },
  personal_best:      { icon: Timer,      color: "text-cyan-400",   badge: "PB"           },
  hcim_death:         { icon: Flame,      color: "text-red-600",    badge: "HCIM Death"   },
  loot_key:           { icon: KeyRound,   color: "text-yellow-500", badge: "Loot Key"     },
};

const FALLBACK_META = { icon: Gem, color: "text-muted-foreground", badge: "Event" };

function formatGp(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)         return `${Math.round(v / 1_000)}K`;
  return v.toLocaleString();
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatValue(item: FeedItem): string | null {
  if (item.value === null || item.value === undefined) return null;
  switch (item.type) {
    case "drop":
    case "clue":
    case "pk":
    case "loot_key":
      return `${formatGp(item.value)} gp`;
    case "level":
      return `Level ${item.value}`;
    case "xp_milestone":
      return `${formatGp(item.value)} xp`;
    case "personal_best":
      return formatTime(item.value);
    default:
      return null;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function DashboardPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerBadges, setPlayerBadges] = useState<PlayerBadge[]>([]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(`${API_URL}/badges/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() as Promise<PlayerBadge[]> : Promise.resolve([]))
      .then(setPlayerBadges)
      .catch(() => {});
  }, [user?.discord_user_id]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !user?.rsn) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/members/me/feed?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json() as Promise<FeedItem[]>)
      .then(setFeed)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.rsn]);

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      {/* ── Welcome / Account ─────────────────────────────────── */}
      <Card className="self-start">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=64`}
                alt=""
                className="h-12 w-12 rounded-full shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
            )}
            <div className="min-w-0">
              <CardTitle className="font-rs-bold text-3xl text-primary leading-tight">
                Welcome, {user.rsn ?? user.username}!
              </CardTitle>
              {(() => {
                const top = highestRoleDisplay(user.effective_roles, user.role_labels);
                return top && top in ROLE_BADGE_CLASS ? (
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 mt-1", ROLE_BADGE_CLASS[top])}>
                    {top}
                  </Badge>
                ) : null;
              })()}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!user.rsn && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Link your RSN in{" "}
              <Link to="/members/settings" className="underline font-medium">Settings</Link>{" "}
              to unlock your activity feed, stats, and full member features.
            </p>
          )}

          {/* Profile details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discord</span>
              <span className="text-foreground">{user.username}</span>
            </div>
            {user.rsn && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">RSN</span>
                <span className="text-foreground">{user.rsn}</span>
              </div>
            )}
            {user.clan_rank && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">In-game rank</span>
                <span className="text-foreground">{user.clan_rank}</span>
              </div>
            )}
            {user.clan_rank && getDisplayRank(user.clan_rank) !== user.clan_rank && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Community rank</span>
                <span className="text-foreground">{getDisplayRank(user.clan_rank)}</span>
              </div>
            )}
            {hasPermission("staff.home", "read", user.effective_roles) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staff role</span>
                <span className="text-foreground">{highestRoleDisplay(user.effective_roles, user.role_labels)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Player badges */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Badges</p>
            {playerBadges.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No badges earned yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {playerBadges.map((b) => {
                  const isSvg = b.icon?.trimStart().startsWith("<");
                  return (
                    <span
                      key={b.id}
                      title={b.description}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ background: b.color, color: b.text_color }}
                    >
                      {b.icon && (
                        isSvg ? (
                          <span className="h-3.5 w-3.5 shrink-0" dangerouslySetInnerHTML={{ __html: b.icon }} style={{ color: b.text_color }} />
                        ) : (
                          <img src={b.icon} alt="" className="h-3.5 w-3.5 shrink-0 object-contain" />
                        )
                      )}
                      {b.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Activity Feed ─────────────────────────────────────── */}
      <Card className="self-start row-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="font-rs-bold text-xl text-primary">Your Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!user.rsn ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Link your RSN in{" "}
              <Link to="/members/settings" className="underline text-foreground">
                Settings
              </Link>{" "}
              to see your activity feed.
            </p>
          ) : loading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
          ) : feed.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {feed.map((item, i) => {
                const meta = FEED_META[item.type] ?? FALLBACK_META;
                const Icon = meta.icon;
                const value = formatValue(item);
                return (
                  <li key={i} className="flex items-center gap-3 px-4 py-1.5">
                    <FeedIcon
                      type={item.type}
                      label={item.label}
                      Fallback={Icon}
                      className={`h-4 w-4 shrink-0 ${meta.color}`}
                    />
                    <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                      {item.label}
                    </span>
                    {item.detail && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {item.detail}
                      </span>
                    )}
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {meta.badge}
                    </Badge>
                    {value && (
                      <span className={`shrink-0 font-rs-bold text-sm ${meta.color}`}>
                        {value}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-muted-foreground w-14 text-right">
                      {timeAgo(item.timestamp)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

