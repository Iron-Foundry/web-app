import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { API_URL } from "@/context/AuthContext";
import clanPhoto from "@/assets/clan-photo.png";
import bannerLogo from "@/assets/BannerLogo-160x87.png";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Gem, TrendingUp, Zap } from "lucide-react";

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const WOM_GROUP_ID = 9403;

interface WomGroupResponse {
  memberCount: number;
  memberships: { player: { exp: number; ehb: number } }[];
}


type AchievementType = "drop" | "level" | "xp_milestone";

interface Achievement {
  type: AchievementType;
  player: string;
  label: string;
  detail?: string;
  value: number;
}

const ACHIEVEMENT_META: Record<
  AchievementType,
  {
    icon: React.ElementType;
    color: string;
    badge: string;
  }
> = {
  drop:         { icon: Gem,        color: "text-primary",  badge: "Drop"         },
  level:        { icon: TrendingUp, color: "text-green-400", badge: "Level Up"     },
  xp_milestone: { icon: Zap,        color: "text-blue-400",  badge: "XP Milestone" },
};

function formatGp(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toLocaleString();
}

function formatAchievementValue(a: Achievement): string {
  switch (a.type) {
    case "drop":         return formatGp(a.value);
    case "level":        return `Level ${a.value}`;
    case "xp_milestone": return `${formatGp(a.value)} xp`;
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-5">
        <span className="text-2xl font-rs-bold text-primary">{value}</span>
        <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

function HomePage() {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [clanXp, setClanXp] = useState<number | null>(null);
  const [clanEhb, setClanEhb] = useState<number | null>(null);
  const [totalGp, setTotalGp] = useState<number | null>(null);
  const [collectionLogItems, setCollectionLogItems] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  useEffect(() => {
    fetch(`https://api.wiseoldman.net/v2/groups/${WOM_GROUP_ID}`)
      .then((r) => r.json() as Promise<WomGroupResponse>)
      .then((data) => {
        setMemberCount(data.memberCount ?? null);
        const totalXp = data.memberships?.reduce(
          (sum, m) => sum + (m.player?.exp ?? 0),
          0,
        ) ?? null;
        setClanXp(totalXp > 0 ? totalXp : null);
        const totalEhb = data.memberships?.reduce(
          (sum, m) => sum + (m.player?.ehb ?? 0),
          0,
        ) ?? null;
        setClanEhb(totalEhb > 0 ? Math.round(totalEhb) : null);
      })
      .catch(() => {});

    fetch(`${API_URL}/clan/stats`)
      .then((r) => r.json() as Promise<{ total_gp: number; collection_log_items: number }>)
      .then((data) => {
        setTotalGp(data.total_gp ?? null);
        setCollectionLogItems(data.collection_log_items ?? null);
      })
      .catch(() => {});

    fetch(`${API_URL}/clan/recent-achievements?limit=20`)
      .then((r) => r.json() as Promise<Achievement[]>)
      .then(setAchievements)
      .catch(() => {})
      .finally(() => setAchievementsLoading(false));
  }, []);

  return (
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
              <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 22 22">
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
      <section className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Members"
            value={memberCount !== null ? memberCount.toLocaleString() : "—"}
          />
          <StatCard
            label="Clan XP"
            value={clanXp !== null ? formatGp(clanXp) : "—"}
          />
          <StatCard
            label="Clan EHB"
            value={clanEhb !== null ? clanEhb.toLocaleString() : "—"}
          />
        </div>
        <div className="flex justify-center gap-4">
          <div className="w-full max-w-xs">
            <StatCard
              label="Total GP Looted"
              value={totalGp !== null ? formatGp(totalGp) : "—"}
            />
          </div>
          <div className="w-full max-w-xs">
            <StatCard
              label="Collection Log Items"
              value={collectionLogItems !== null ? collectionLogItems.toLocaleString() : "—"}
            />
          </div>
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
          <div className="overflow-hidden rounded-xl border border-border">
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
              <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
            ) : achievements.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No recent achievements yet.</p>
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
                      <span className={`ml-auto shrink-0 font-rs-bold text-sm ${meta.color}`}>
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
  );
}
