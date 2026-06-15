import { useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { useAuth } from "@/context/AuthContext";
import { useWomStats, useClanStats, useRecentAchievements, useHomeCompetitions } from "@/hooks/useHome";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, ExternalLink } from "lucide-react";
import { StatsSection } from "@/components/home/StatsSection";
import { AchievementsSection } from "@/components/home/AchievementsSection";
import { RankSection } from "@/components/home/RankSection";
import type { Competition } from "@/types/competitions";
import { shineHandlers } from "@/hooks/useShineEffect";
import clanPhoto from "@/assets/clan-photo.png";
import bannerLogo from "@/assets/BannerLogo-160x87.png";

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

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
  const { user } = useAuth();
  const isOngoing = comp.status === "ongoing";
  const accent = isOngoing
    ? { border: "border-green-500/40", bar: "bg-green-500", text: "text-green-600 dark:text-green-400", icon: "text-green-500" }
    : { border: "border-blue-500/40",  bar: "bg-blue-500",  text: "text-blue-600 dark:text-blue-400",  icon: "text-blue-500" };

  return (
    <div className={`fixed left-4 z-40 w-64 animate-in slide-in-from-left-2 duration-200 ${user ? "top-27" : "top-17"}`}>
      <Card className={`${accent.border} bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent.bar}`} />
        <CardContent className="pl-4 pr-3 py-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Trophy className={`h-3.5 w-3.5 shrink-0 ${accent.icon}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${accent.text}`}>
                {isOngoing ? "Live Competition" : "Upcoming Competition"}
              </span>
            </div>
            <button onClick={onDismiss} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" aria-label="Dismiss">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{comp.title}</p>
          <div className="space-y-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{fmtMetric(comp.metric)}</Badge>
            <div className={`flex items-center gap-1 text-xs ${accent.text}`}>
              <Clock className="h-3 w-3 shrink-0" />
              {isOngoing ? timeLeft(comp.endsAt) : `starts in ${timeLeft(comp.startsAt).replace(" left", "")}`}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <a href={comp.competition_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              WOM <ExternalLink className="h-3 w-3" />
            </a>
            <Link to="/competitions/$compId" params={{ compId: String(comp.id) }} search={{ tab: undefined }}
              className="text-xs text-primary hover:underline">
              Take me there!
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const divider = (
  <div className="flex items-center justify-center gap-2">
    <span className="h-1 w-1 rounded-full bg-border" />
    <div className="h-px w-24 bg-border" />
    <span className="h-1 w-1 rounded-full bg-border" />
  </div>
);

function HomePage() {
  const { data: womStats } = useWomStats();
  const { data: clanStats } = useClanStats();
  const { data: achievements = [], isLoading: achievementsLoading } = useRecentAchievements();
  const { data: competitions = [] } = useHomeCompetitions();
  const [compDismissed, setCompDismissed] = useState(false);

  const activeComp = competitions.find((c) => c.status === "ongoing") ?? competitions.find((c) => c.status === "upcoming") ?? null;

  const statsProps = {
    memberCount: womStats?.member_count ?? null,
    clanXp: womStats && womStats.total_xp > 0 ? womStats.total_xp : null,
    clanEhb: womStats && womStats.total_ehb > 0 ? womStats.total_ehb : null,
    coxKc: womStats && womStats.cox_kc > 0 ? womStats.cox_kc : null,
    tobKc: womStats && womStats.tob_kc > 0 ? womStats.tob_kc : null,
    toaKc: womStats && womStats.toa_kc > 0 ? womStats.toa_kc : null,
    totalGp: clanStats?.total_gp ?? null,
    clanPhoto,
  };

  return (
    <>
      {activeComp && !compDismissed && (
        <LiveCompetitionBox comp={activeComp} onDismiss={() => setCompDismissed(true)} />
      )}
      <div className="mx-auto max-w-5xl space-y-10 py-6">
        <section className="flex flex-col items-center gap-6 text-center">
          <div className="relative space-y-2">
            <img src={bannerLogo} alt="" aria-hidden
              className="pointer-events-none absolute inset-0 mx-auto h-[1600%] w-[1600%] object-contain opacity-15 top-[calc(50%-8px)] -translate-y-1/2 left-1/2 -translate-x-1/2" />
            <h1 className="relative font-rs-bold text-6xl text-primary leading-tight">Iron Foundry</h1>
            <p className="relative text-lg text-foreground/60">An Ironman focused Mixed PvM Clan</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a href="https://discord.gg/ironfoundry" target="_blank" rel="noopener noreferrer">
                <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 22 22">
                  <path fill="#5865F2" fillRule="evenodd" d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
                </svg>
                Join us on Discord
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="https://wiseoldman.net/groups/9403" target="_blank" rel="noopener noreferrer">
                <img src="https://avatars.githubusercontent.com/u/65183441?v=4" alt="" className="h-5 w-5 rounded-sm" />
                Wise Old Man
              </a>
            </Button>
          </div>
        </section>

        <StatsSection {...statsProps} />
        {divider}

        <div
          className="stat-card shine-border"
          {...shineHandlers}
        >
          <section className="relative overflow-hidden rounded-[10px] border border-border bg-background">
            <img src={clanPhoto} alt="Iron Foundry clan photograph" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-background/30" />
            <div className="relative space-y-3 px-8 py-10">
              <h2 className="font-rs-bold text-3xl text-primary">Who we are</h2>
              <p className="leading-relaxed text-foreground/90 max-w-2xl">
                Iron Foundry is a community of like-minded Ironmen/Ironwomen in Old School Runescape. We pride ourselves on the varying skill levels and progression levels of our players. Our focus is always creating a fun environment for everyone to relax and enjoy their time in-game.
              </p>
              <p className="leading-relaxed text-foreground/90 max-w-2xl">
                We have a progression system based on your achievements ingame, a mentorship program to help take any next steps for your account, a dedicated event team, and even just a nice place to bank stand and chat if thats more your style!
              </p>
              <p className="leading-relaxed text-foreground/90 max-w-2xl">
                No requirements to join! We have a spot for you even if you are just coming off Tutorial Island or rocking Blorva. If you are looking for community to grow with, learn new skills, and make friends join our ranks!
              </p>
            </div>
          </section>
        </div>
        {divider}

        <RankSection />
        {divider}

        <AchievementsSection achievements={achievements} isLoading={achievementsLoading} />
      </div>
    </>
  );
}
