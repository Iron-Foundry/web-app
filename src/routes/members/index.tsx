import { useRef, useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { highestRoleDisplay, INGAME_TO_DISPLAY } from "@/lib/ranks";
import { usePermissions } from "@/context/PermissionsContext";
import { cn } from "@/lib/utils";
import { useMyBadges, useMyFeed, useNameChanges, useDashboardCompetitions, useMeStats, useMyRankings } from "@/hooks/useMemberDashboard";
import { useDynamicCount } from "@/hooks/useDynamicCount";
import type { Competition } from "@/types/competitions";
import { MemberDashboardSkeleton } from "@/components/skeletons/MemberDashboardSkeleton";
import { ActivityFeedSheet } from "@/components/members/ActivityFeedSheet";
import { NameChangesSheet } from "@/components/members/NameChangesSheet";
import { CompetitionsSheet } from "@/components/members/CompetitionsSheet";
import { BadgeHoverCard } from "@/components/badges/badgeHoverCard";
import {
  FEED_META, FALLBACK_META, FeedIcon,
  formatValue, formatGp, timeAgo, fmtFullDate,
} from "@/components/members/feedHelpers";
import { ArrowRight, Trophy, Users, ExternalLink, Clock } from "lucide-react";

const ROLE_BADGE_CLASS: Record<string, string> = {
  "Co-owner":         "border-amber-500/60  text-amber-600  dark:text-amber-400",
  "Deputy Owner":     "border-amber-500/60  text-amber-600  dark:text-amber-400",
  "Senior Moderator": "border-red-400/60    text-red-600    dark:text-red-400",
  "Moderator":        "border-orange-400/60 text-orange-600 dark:text-orange-400",
  "Event Team":       "border-green-500/60  text-green-700  dark:text-green-400",
  "Foundry Mentors":  "border-blue-400/60   text-blue-600   dark:text-blue-400",
};

const STATUS_STYLE: Record<Competition["status"], { label: string; className: string }> = {
  ongoing:  { label: "Live",     className: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" },
  upcoming: { label: "Upcoming", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"   },
  finished: { label: "Finished", className: "bg-muted/50 text-muted-foreground border-border"                       },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtMetric(m: string): string {
  return m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function timeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  if (d > 0) return `${d}d ${h}h left`;
  const min = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${min}m left` : `${min}m left`;
}

function CompEntry({
  comp,
  elRef,
}: {
  comp: Competition;
  elRef?: React.RefObject<HTMLLIElement | null>;
}): React.ReactElement {
  const s = STATUS_STYLE[comp.status];
  const isNavigable = comp.status === "ongoing" || comp.status === "upcoming";
  return (
    <li ref={elRef} className="px-4 py-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        {isNavigable ? (
          <Link
            to="/competitions/$compId"
            params={{ compId: String(comp.id) }}
            search={{ tab: undefined }}
            className="font-medium text-foreground text-sm leading-snug hover:text-primary transition-colors"
          >
            {comp.title}
          </Link>
        ) : (
          <span className="font-medium text-foreground text-sm leading-snug">{comp.title}</span>
        )}
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0 mt-0.5", s.className)}>
          {s.label}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground">{fmtMetric(comp.metric)}</div>
      <div className="text-xs text-muted-foreground">
        {fmtDate(comp.startsAt)} – {fmtDate(comp.endsAt)}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {comp.participantCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />{comp.participantCount}
            </span>
          )}
          {comp.status === "ongoing" && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Clock className="h-3 w-3" />{timeLeft(comp.endsAt)}
            </span>
          )}
          {comp.status === "upcoming" && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Clock className="h-3 w-3" />in {timeLeft(comp.startsAt).replace(" left", "")}
            </span>
          )}
        </div>
        <a href={comp.competition_url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          WOM <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </li>
  );
}

export const membersDashboardRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/",
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const { hasPermission } = usePermissions();
  const { data: playerBadges = [] } = useMyBadges(user?.discord_user_id);
  const { data: feed = [], isLoading: feedLoading } = useMyFeed(user?.rsn);
  const { data: meStats } = useMeStats(user?.rsn);
  const { data: rankings = [] } = useMyRankings(user?.discord_user_id);
  const { data: nameChanges = [], isLoading: nameChangesLoading } = useNameChanges();
  const { data: competitions = [], isLoading: compsLoading } = useDashboardCompetitions();

  const [showFeedSheet, setShowFeedSheet] = useState(false);
  const [showNameChangesSheet, setShowNameChangesSheet] = useState(false);
  const [showCompsSheet, setShowCompsSheet] = useState(false);

  const feedContainerRef = useRef<HTMLDivElement>(null);
  const feedItemRef = useRef<HTMLLIElement>(null);
  const compsContainerRef = useRef<HTMLDivElement>(null);
  const compsItemRef = useRef<HTMLLIElement>(null);
  const ncContainerRef = useRef<HTMLDivElement>(null);
  const ncItemRef = useRef<HTMLLIElement>(null);

  const feedCount = useDynamicCount(feedContainerRef, feedItemRef, 26, feed.length, 800);
  const compsCount = useDynamicCount(compsContainerRef, compsItemRef, 100, competitions.length, 720);
  const ncCount = useDynamicCount(ncContainerRef, ncItemRef, 24, nameChanges.length, 720);

  if (loading) return <MemberDashboardSkeleton />;
  if (!user) return null;

  const ongoing  = competitions.filter((c) => c.status === "ongoing");
  const upcoming = competitions.filter((c) => c.status === "upcoming");
  const finished = competitions.filter((c) => c.status === "finished");
  const allComps = [...ongoing, ...upcoming, ...finished];
  const visibleComps = allComps.slice(0, compsCount);
  const hasMoreComps = allComps.length > compsCount;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

      {/* Profile - 4 cols */}
      <Card className="lg:col-span-4 pb-1 flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-center gap-3">
            {user.avatar
              ? <img src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=64`} alt="" className="h-12 w-12 rounded-full shrink-0" />
              : <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
            }
            <div className="min-w-0">
              <CardTitle className="font-rs-bold text-3xl text-primary leading-tight">
                Welcome, {user.rsn ?? user.username}!
              </CardTitle>
              {(() => {
                const top = highestRoleDisplay(user.effective_roles, user.role_labels);
                return top && top in ROLE_BADGE_CLASS
                  ? <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 mt-1", ROLE_BADGE_CLASS[top])}>{top}</Badge>
                  : null;
              })()}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
          {!user.rsn && (
            <p className="shrink-0 text-sm text-yellow-600 dark:text-yellow-400">
              Link your RSN in{" "}
              <Link to="/members/settings" className="underline font-medium">Settings</Link>{" "}
              to unlock your activity feed.
            </p>
          )}
          <div className="shrink-0 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discord</span>
              <span className="text-foreground truncate max-w-35 text-right">{user.username}</span>
            </div>
            {user.rsn && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">RSN</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground">{user.rsn}</span>
                  {user.alts_count > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      +{user.alts_count} alt{user.alts_count > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {user.clan_rank && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rank</span>
                <span className="text-foreground">{INGAME_TO_DISPLAY[user.clan_rank] ?? user.clan_rank}</span>
              </div>
            )}
            {(() => {
              const dr = highestRoleDisplay(user.effective_roles, user.role_labels);
              return dr ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discord Rank</span>
                  <span className="text-foreground">{dr}</span>
                </div>
              ) : null;
            })()}
            {meStats && (
              <>
                {meStats.collection_log_slots > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collection log</span>
                    <span className="text-foreground">
                      {meStats.collection_log_slots.toLocaleString()}
                      {meStats.collection_log_slots_max > 0 && (
                        <span className="text-muted-foreground"> / {meStats.collection_log_slots_max.toLocaleString()}</span>
                      )}
                    </span>
                  </div>
                )}
                {meStats.total_loot_value > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Personal loot</span>
                    <span className="text-foreground">{formatGp(meStats.total_loot_value)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          <Separator className="shrink-0" />

          <div className="shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Account Ranks</p>
            {rankings.length === 0
              ? <p className="text-xs text-muted-foreground italic">No accounts linked.</p>
              : (
                <div className="space-y-1">
                  {rankings.map((a) => (
                    <div key={a.rsn} className="flex items-center justify-between gap-2 text-sm">
                      <span className={cn("truncate", !a.is_primary && "text-muted-foreground text-xs")}>
                        {a.rsn}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 text-right">
                        <span className="text-muted-foreground text-xs">{a.rank ?? "No Rank"}</span>
                        {a.points != null && (
                          <span className="font-rs-bold">{a.points.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          <Separator className="shrink-0" />

          <div className="shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Badges</p>
            {playerBadges.length === 0
              ? <p className="text-xs text-muted-foreground italic">No badges earned yet.</p>
              : (
                <div className="flex flex-wrap gap-2">
                  {playerBadges.map((b) => (
                    <BadgeHoverCard
                      key={b.id}
                      badge={b}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-default"
                    />
                  ))}
                </div>
              )
            }
          </div>

          <Separator className="shrink-0" />

          <div className="flex-1 flex flex-col min-h-0">
            <p className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Name Changes</p>
            {nameChangesLoading
              ? <p className="text-xs text-muted-foreground">Loading…</p>
              : nameChanges.length === 0
              ? <p className="text-xs text-muted-foreground italic">No recent name changes.</p>
              : (
                <div ref={ncContainerRef} className="flex-1 min-h-0">
                  <ul className="divide-y divide-border -mx-6">
                    {nameChanges.slice(0, ncCount).map((nc, i) => (
                      <li
                        ref={i === 0 ? ncItemRef : undefined}
                        key={i}
                        className="flex items-center gap-2 px-6 py-1 text-sm"
                      >
                        <span className="font-medium text-muted-foreground truncate flex-1 min-w-0">{nc.old_name}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                        <span className="font-medium text-foreground truncate flex-1 min-w-0 text-right">{nc.new_name}</span>
                        {nc.resolved_at && (
                          <span className="shrink-0 text-xs text-muted-foreground/70 pl-1">{timeAgo(nc.resolved_at)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
          </div>
        </CardContent>
        {nameChanges.length > ncCount && (
          <button
            onClick={() => setShowNameChangesSheet(true)}
            className="px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left shrink-0"
          >
            Show {nameChanges.length - ncCount} more…
          </button>
        )}
      </Card>

      {/* Activity Feed - 5 cols */}
      <Card className="lg:col-span-5 pb-1 flex flex-col">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="font-rs-bold text-xl text-primary">Your Activity Feed</CardTitle>
        </CardHeader>
        <Separator className="shrink-0" />
        <CardContent className="p-0 flex-1 flex flex-col">
          <div ref={feedContainerRef} className="flex-1 min-h-0">
            {!user.rsn
              ? <p className="px-4 py-6 text-sm text-muted-foreground">
                  Link your RSN in{" "}
                  <Link to="/members/settings" className="underline text-foreground">Settings</Link>{" "}
                  to see your activity feed.
                </p>
              : feedLoading
              ? <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
              : feed.length === 0
              ? <p className="px-4 py-6 text-sm text-muted-foreground">No activity recorded yet.</p>
              : (
                <TooltipProvider delayDuration={300}>
                  <ul className="divide-y divide-border border-b border-border">
                    {feed.slice(0, feedCount).map((item, i) => {
                      const meta = FEED_META[item.type] ?? FALLBACK_META;
                      const Icon = meta.icon;
                      const value = formatValue(item);
                      return (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <li
                              ref={i === 0 ? feedItemRef : undefined}
                              className="flex items-center gap-3 px-4 py-1.5 cursor-default"
                            >
                              <FeedIcon type={item.type} label={item.label} Fallback={Icon}
                                className={`h-4 w-4 shrink-0 ${meta.color}`} />
                              <Badge variant="link" className="shrink-0 text-[10px] w-16 justify-center">{meta.badge}</Badge>
                              <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">{item.label}</span>
                              {item.detail && <span className="text-xs text-muted-foreground shrink-0">{item.detail}</span>}
                              {value && <span className={`shrink-0 font-rs-bold text-sm ${meta.color}`}>{value}</span>}
                              <span className="shrink-0 text-xs text-muted-foreground w-14 text-right">{timeAgo(item.timestamp)}</span>
                            </li>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-64 p-3 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Icon className={`h-3.5 w-3.5 shrink-0 ${meta.color}`} />
                              <span className={`text-xs font-semibold ${meta.color}`}>{meta.badge}</span>
                            </div>
                            <p className="text-sm font-medium text-popover-foreground">{item.label}</p>
                            {item.rsn && <p className="text-xs text-muted-foreground">Account: <span className="font-medium text-foreground">{item.rsn}</span></p>}
                            {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
                            {value && <p className={`text-sm font-rs-bold ${meta.color}`}>{value}</p>}
                            <p className="text-xs text-muted-foreground border-t border-border pt-1.5">{fmtFullDate(item.timestamp)}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </ul>
                </TooltipProvider>
              )
            }
          </div>
        </CardContent>
        {feed.length > feedCount && (
          <button
            onClick={() => setShowFeedSheet(true)}
            className="px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left shrink-0"
          >
            Show {feed.length - feedCount} more events...
          </button>
        )}
      </Card>

      <ActivityFeedSheet open={showFeedSheet} onOpenChange={setShowFeedSheet} feed={feed} />
      <NameChangesSheet open={showNameChangesSheet} onOpenChange={setShowNameChangesSheet} nameChanges={nameChanges} />
      <CompetitionsSheet open={showCompsSheet} onOpenChange={setShowCompsSheet} competitions={competitions} />

      {/* Competitions - 3 cols */}
      <Card className="lg:col-span-3 pb-1 flex flex-col">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="font-rs-bold text-xl text-primary flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Competitions
          </CardTitle>
        </CardHeader>
        <Separator className="shrink-0" />
        <CardContent className="p-0 flex-1 flex flex-col">
          {compsLoading
            ? <p className="px-4 py-4 text-sm text-muted-foreground">Loading…</p>
            : competitions.length === 0
            ? <p className="px-4 py-4 text-sm text-muted-foreground italic">No competitions found.</p>
            : (() => {
                const visibleOngoing  = visibleComps.filter((c) => c.status === "ongoing");
                const visibleUpcoming = visibleComps.filter((c) => c.status === "upcoming");
                return (
                  <>
                    {(visibleOngoing.length > 0 || visibleUpcoming.length > 0) && (
                      <div className="shrink-0 px-4 pt-3 pb-1 flex flex-col gap-1.5">
                        {[...visibleOngoing, ...visibleUpcoming].map((comp) => {
                          const isLive = comp.status === "ongoing";
                          return (
                            <Link
                              key={comp.id}
                              to="/competitions/$compId"
                              params={{ compId: String(comp.id) }}
                              search={{ tab: undefined }}
                              className={cn(
                                "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                                isLive
                                  ? "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                                  : "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20",
                              )}
                            >
                              <span className="truncate">{comp.title}</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0 text-[10px] px-1.5 py-0",
                                  isLive
                                    ? "border-green-500/40 text-green-700 dark:text-green-400"
                                    : "border-blue-500/40 text-blue-700 dark:text-blue-400",
                                )}
                              >
                                {isLive ? "Live" : "Upcoming"}
                              </Badge>
                            </Link>
                          );
                        })}
                        <Separator className="mt-1" />
                      </div>
                    )}
                    <div ref={compsContainerRef} className="flex-1 min-h-0">
                      <ul className="divide-y divide-border">
                        {visibleComps.map((c, i) => (
                          <CompEntry
                            key={c.id}
                            comp={c}
                            elRef={i === 0 ? compsItemRef : undefined}
                          />
                        ))}
                      </ul>
                    </div>
                  </>
                );
              })()
          }
        </CardContent>
        {hasMoreComps && (
          <button
            onClick={() => setShowCompsSheet(true)}
            className="px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left shrink-0"
          >
            Show {allComps.length - compsCount} more…
          </button>
        )}
      </Card>

    </div>
  );
}
