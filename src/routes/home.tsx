import { useEffect, useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { API_URL } from "@/context/AuthContext";
import { fetchCached } from "@/lib/cache";
import clanPhoto from "@/assets/clan-photo.png";
import bannerLogo from "@/assets/BannerLogo-160x87.png";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Gem, TrendingUp, Zap, Trophy, Clock, X, ExternalLink } from "lucide-react";

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

interface WomStatsResponse {
  member_count: number;
  total_xp: number;
  total_ehb: number;
  cox_kc: number;
  tob_kc: number;
  toa_kc: number;
}

type AchievementType = "drop" | "level" | "xp_milestone";

interface Achievement {
  type: AchievementType;
  player: string;
  label: string;
  detail?: string;
  value: number;
}

interface Competition {
  id: number;
  title: string;
  metric: string;
  type: string;
  startsAt: string;
  endsAt: string;
  status: "upcoming" | "ongoing" | "finished";
  competition_url: string;
  metric_url: string;
  participantCount: number;
}

const ACHIEVEMENT_META: Record<
  AchievementType,
  {
    icon: React.ElementType;
    color: string;
    badge: string;
  }
> = {
  drop: { icon: Gem, color: "text-primary", badge: "Drop" },
  level: { icon: TrendingUp, color: "text-green-400", badge: "Level Up" },
  xp_milestone: { icon: Zap, color: "text-blue-400", badge: "XP Milestone" },
};

function formatGp(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toLocaleString();
}

function formatAchievementValue(a: Achievement): string {
  switch (a.type) {
    case "drop":
      return formatGp(a.value);
    case "level":
      return `Level ${a.value}`;
    case "xp_milestone":
      return `${formatGp(a.value)} xp`;
  }
}

const WIKI = "https://oldschool.runescape.wiki/images";

function wikiIconUrl(type: AchievementType, label: string): string {
  if (label === "Total Level") return `${WIKI}/Stats_icon.png`;
  const slug = label.replace(/ /g, "_");
  if (type === "drop") return `${WIKI}/${slug}.png`;
  return `${WIKI}/${slug}_icon.png`;
}

function AchievementIcon({
  type,
  label,
  Fallback,
  className,
}: {
  type: AchievementType;
  label: string;
  Fallback: React.ElementType;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Fallback className={className} />;
  return (
    <img
      src={wikiIconUrl(type, label)}
      alt=""
      className="h-4 w-4 shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function StatCard({
  label,
  value,
  backdrop,
  backdropOpacity = 0.15,
}: {
  label: string;
  value: string;
  backdrop?: string;
  backdropOpacity?: number;
}) {
  return (
    <Card className="relative overflow-hidden">
      {backdrop && (
        <img
          src={backdrop}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ opacity: backdropOpacity }}
        />
      )}
      <CardContent className="relative flex flex-col items-center justify-center">
        <span className="text-2xl font-rs-bold text-primary">{value}</span>
        <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

function fmtMetric(m: string): string {
  return m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
}

function LiveCompetitionBox({ comp, onDismiss }: { comp: Competition; onDismiss: () => void }) {
  return (
    <div className="fixed top-20 left-4 z-40 w-64 animate-in slide-in-from-left-2 duration-300">
      <Card className="border-green-500/40 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
        <CardContent className="pl-4 pr-3 py-3 space-y-2">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Trophy className="h-3.5 w-3.5 shrink-0 text-green-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                Live Competition
              </span>
            </div>
            <button
              onClick={onDismiss}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Competition name */}
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
            {comp.title}
          </p>

          {/* Metric + time */}
          <div className="space-y-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {fmtMetric(comp.metric)}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Clock className="h-3 w-3 shrink-0" />
              {timeLeft(comp.endsAt)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-0.5">
            <a
              href={comp.competition_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              WOM <ExternalLink className="h-3 w-3" />
            </a>
            <Link
              to="/members"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HomePage() {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [clanXp, setClanXp] = useState<number | null>(null);
  const [clanEhb, setClanEhb] = useState<number | null>(null);
  const [coxKc, setCoxKc] = useState<number | null>(null);
  const [tobKc, setTobKc] = useState<number | null>(null);
  const [toaKc, setToaKc] = useState<number | null>(null);
  const [totalGp, setTotalGp] = useState<number | null>(null);
  const [totalLogSlots, setTotalLogSlots] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [activeComp, setActiveComp] = useState<Competition | null>(null);
  const [compDismissed, setCompDismissed] = useState(false);

  useEffect(() => {
    fetchCached<WomStatsResponse>(`${API_URL}/clan/wom-stats`, { cacheKey: "home:wom-stats" })
      .then((data) => {
        setMemberCount(data.member_count ?? null);
        setClanXp(data.total_xp > 0 ? data.total_xp : null);
        setClanEhb(data.total_ehb > 0 ? data.total_ehb : null);
        setCoxKc(data.cox_kc > 0 ? data.cox_kc : null);
        setTobKc(data.tob_kc > 0 ? data.tob_kc : null);
        setToaKc(data.toa_kc > 0 ? data.toa_kc : null);
      })
      .catch(() => {});

    fetchCached<{ total_gp: number; collection_log_items: number }>(
      `${API_URL}/clan/stats`,
      { cacheKey: "home:stats" },
    )
      .then((data) => {
        setTotalGp(data.total_gp ?? null);
        setTotalLogSlots(data.collection_log_items ?? null);
      })
      .catch(() => {});

    fetchCached<Achievement[]>(
      `${API_URL}/clan/recent-achievements?limit=20`,
      { cacheKey: "home:recent-achievements" },
    )
      .then(setAchievements)
      .catch(() => {})
      .finally(() => setAchievementsLoading(false));

    fetchCached<Competition[]>(
      `${API_URL}/clan/competitions`,
      { cacheKey: "home:competitions", ttl: 5 * 60 * 1000 },
    )
      .then((data) => {
        const ongoing = data.find((c) => c.status === "ongoing");
        setActiveComp(ongoing ?? null);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {activeComp && !compDismissed && (
        <LiveCompetitionBox comp={activeComp} onDismiss={() => setCompDismissed(true)} />
      )}

      <div className="mx-auto max-w-5xl space-y-10 py-6">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="flex flex-col items-center gap-6 text-center">
          <img src={bannerLogo} alt="Iron Foundry" className="h-auto w-40" />
          <div className="space-y-2">
            <h1 className="font-rs-bold text-6xl text-primary leading-tight">
              Iron Foundry
            </h1>
            <p className="text-lg text-muted-foreground">
              An Ironman focused Mixed PvM Clan
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a
                href="https://discord.gg/ironfoundry"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className="h-7 w-7"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="-3 -3 22 22"
                >
                  <path
                    fill="#5865F2"
                    fillRule="evenodd"
                    d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"
                  />
                </svg>
                Join us on Discord
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a
                href="https://wiseoldman.net/groups/9403"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://avatars.githubusercontent.com/u/65183441?v=4"
                  alt=""
                  className="h-5 w-5 rounded-sm"
                />
                Wise Old Man
              </a>
            </Button>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Member Count"
              value={memberCount !== null ? memberCount.toLocaleString() : "-"}
              backdrop={clanPhoto}
              backdropOpacity={0.25}
            />
            <StatCard
              label="Total XP"
              value={clanXp !== null ? formatGp(clanXp) : "-"}
              backdrop="https://oldschool.runescape.wiki/images/thumb/Forestry-_Part_Two_-_Community_Consultation_%281%29.png/640px-Forestry-_Part_Two_-_Community_Consultation_%281%29.png?b1a37"
              backdropOpacity={0.25}
              />
            <StatCard
              label="Total EHB"
              value={clanEhb !== null ? clanEhb.toLocaleString() : "-"}
              backdrop="https://oldschool.runescape.wiki/images/thumb/Araxxor_artwork_3D_no_text.png/614px-Araxxor_artwork_3D_no_text.png?79f22"
              backdropOpacity={0.25}
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <StatCard
              label="Loot Value"
              value={totalGp !== null ? formatGp(totalGp) : "-"}
              backdrop="https://oldschool.runescape.wiki/images/thumb/Loot_Chest_%28opened%29.png/489px-Loot_Chest_%28opened%29.png?b8b83"
              backdropOpacity={0.25}
            />
            <StatCard
              label="Tombs of Amascut"
              value={toaKc !== null ? toaKc.toLocaleString() : "-"}
              backdrop="https://oldschool.runescape.wiki/images/thumb/Tombs_of_Amascut_-_necropolis_concept_art.jpg/640px-Tombs_of_Amascut_-_necropolis_concept_art.jpg?b3e2f"
              backdropOpacity={0.25}
            />
            <StatCard
              label="Chambers of Xeric"
              value={coxKc !== null ? coxKc.toLocaleString() : "-"}
              backdrop="https://oldschool.runescape.wiki/images/thumb/Chambers_of_Xeric_artwork.jpg/640px-Chambers_of_Xeric_artwork.jpg?090e1"
              backdropOpacity={0.25}
            />
            <StatCard
              label="Theatre of Blood"
              value={tobKc !== null ? tobKc.toLocaleString() : "-"}
              backdrop="https://oldschool.runescape.wiki/images/thumb/Theatre_of_Blood_artwork.jpg/640px-Theatre_of_Blood_artwork.jpg?92a5f"
              backdropOpacity={0.25}
            />
          </div>
        </section>

        <Separator />

        {/* ── About + Discord ──────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="space-y-3">
              <h2 className="font-rs-bold text-3xl text-primary">Who we are</h2>
              <p className="leading-relaxed text-muted-foreground">
                Iron Foundry is a community of like-minded Ironmen/Ironwomen in
                Old School Runescape. We pride ourselves on the varying skill
                levels and progression levels of our players. Our focus is always
                creating a fun environment for everyone to relax and enjoy their
                time in-game.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                We have a progression system based on your achievements ingame, a
                mentorship program to help take any next steps for your account, a
                dedicated event team, and even just a nice place to bank stand and
                chat if thats more your style!
              </p>
              <p className="leading-relaxed text-muted-foreground">
                No requirements to join! We have a spot for you even if you are
                just coming off Tutorial Island or rocking Blorva. If you are
                looking for community to grow with, learn new skills, and make
                friends join our ranks!
              </p>
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              <img
                src={clanPhoto}
                alt="Iron Foundry clan photograph"
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-rs-bold text-3xl text-primary">Jump on Voice!</h2>
            <iframe
              src="https://discord.com/widget?id=945052365327839254&theme=dark"
              width="100%"
              height="550"
              frameBorder="0"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              className="rounded-sm border border-border"
            />
          </div>
        </section>

        <Separator />

        {/* ── Recent Achievements ───────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="font-rs-bold text-3xl text-primary">
            Recent Achievements
          </h2>
          <Card>
            <CardContent className="p-0">
              {achievementsLoading ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  Loading…
                </p>
              ) : achievements.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  No recent achievements yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {achievements.map((achievement, i) => {
                    const meta = ACHIEVEMENT_META[achievement.type];
                    const Icon = meta.icon;
                    return (
                      <li key={i} className="flex items-center gap-3 px-4 py-1.5">
                        <AchievementIcon
                          type={achievement.type}
                          label={achievement.label}
                          Fallback={Icon}
                          className={`h-4 w-4 shrink-0 ${meta.color}`}
                        />
                        <span className="text-sm font-medium text-foreground truncate">
                          {achievement.label}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {achievement.player}
                        </span>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {achievement.detail ?? meta.badge}
                        </Badge>
                        <span
                          className={`ml-auto shrink-0 font-rs-bold text-sm ${meta.color}`}
                        >
                          {formatAchievementValue(achievement)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
