import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { useWomStats, useClanStats, useRecentAchievements, useHomeCompetitions } from "@/hooks/useHome";
import { Button } from "@/components/ui/button";
import { StatsSection } from "@/components/home/StatsSection";
import { AchievementsSection } from "@/components/home/AchievementsSection";
import { RankSection } from "@/components/home/RankSection";
import { EventBanner } from "@/components/home/EventBanner";
import { CompetitionNotice } from "@/components/home/CompetitionNotice";
import { DiscordIcon } from "@/components/layout/FooterIcons";
import clanPhoto from "@/assets/clan-photo.png";
import logo from "@/assets/LogoTSPSmall-320x320.png";

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const WHO_WE_ARE = [
  "Iron Foundry is a community of like-minded Ironmen/Ironwomen in Old School Runescape. We pride ourselves on the varying skill levels and progression levels of our players. Our focus is always creating a fun environment for everyone to relax and enjoy their time in-game.",
  "We have a progression system based on your achievements ingame, a mentorship program to help take any next steps for your account, a dedicated event team, and even just a nice place to bank stand and chat if thats more your style!",
  "No requirements to join! We have a spot for you even if you are just coming off Tutorial Island or rocking Blorva. If you are looking for community to grow with, learn new skills, and make friends join our ranks!",
];

function Hero(): React.ReactElement {
  return (
    <section className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
      <div className="min-w-0">
        <img src={logo} alt="Iron Foundry monogram" className="mb-4 h-16 w-16 md:h-20 md:w-20" />
        <h1 className="font-rs-bold text-5xl leading-none text-mark md:text-7xl">Iron Foundry</h1>
        <p className="mt-3 text-xl text-mk-body">An Ironman focused Mixed PvM Clan</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href="https://discord.gg/ironfoundry" target="_blank" rel="noopener noreferrer"><DiscordIcon />Join us on Discord</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://wiseoldman.net/groups/9403" target="_blank" rel="noopener noreferrer">
              <img src="https://avatars.githubusercontent.com/u/65183441?v=4" alt="Wise Old Man logo" className="h-5 w-5 rounded-sm" />
              Wise Old Man
            </a>
          </Button>
        </div>
      </div>
      <img src={clanPhoto} alt="Iron Foundry clan photograph" className="aspect-video w-full rounded-xl border border-border object-cover" />
    </section>
  );
}

function HomePage() {
  const { data: womStats } = useWomStats();
  const { data: clanStats } = useClanStats();
  const { data: achievements = [], isLoading: achievementsLoading } = useRecentAchievements();
  const { data: competitions = [] } = useHomeCompetitions();
  const [compDismissed, setCompDismissed] = useState(false);

  const activeComp = competitions.find((c) => c.status === "ongoing") ?? competitions.find((c) => c.status === "upcoming") ?? null;
  const positive = (n: number | undefined): number | null => (n && n > 0 ? n : null);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-14 py-6">
      {activeComp && !compDismissed && <CompetitionNotice comp={activeComp} onDismiss={() => setCompDismissed(true)} />}
      <Hero />
      <EventBanner />
      <StatsSection
        memberCount={womStats?.member_count ?? null}
        clanXp={positive(womStats?.total_xp)}
        clanEhb={positive(womStats?.total_ehb)}
        coxKc={positive(womStats?.cox_kc)}
        tobKc={positive(womStats?.tob_kc)}
        toaKc={positive(womStats?.toa_kc)}
        tfaKc={positive(womStats?.tfa_kc)}
        totalGp={clanStats?.total_gp ?? null}
        clanPhoto={clanPhoto}
      />
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 font-rs-bold text-3xl text-foreground">Who we are</h2>
        <div className="space-y-3 leading-relaxed text-mk-body">
          {WHO_WE_ARE.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
        </div>
      </section>
      <RankSection />
      <AchievementsSection achievements={achievements} isLoading={achievementsLoading} />
    </div>
  );
}
