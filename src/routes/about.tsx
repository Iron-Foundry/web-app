import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { PageHead } from "@/components/layout/PageHead";
import logo from "@/assets/LogoTSPSmall-320x320.png";
import {
  Trophy,
  GraduationCap,
  CalendarDays,
  ShieldCheck,
  MessageSquare,
  Swords,
} from "lucide-react";

export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function FeatureCard({ icon: Icon, title, children }: FeatureCardProps) {
  return (
    <article className="space-y-3 rounded-xl border border-border bg-card p-6">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="font-rs-bold text-xl text-foreground">{title}</h3>
      <div className="space-y-2 leading-relaxed text-mk-body">{children}</div>
    </article>
  );
}

function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 py-6">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <PageHead
        title="About Us"
        lede="We're a community-driven clan built for Ironmen and Ironwomen who want to progress, improve, and enjoy every stage of the game together. Whether you're just starting out on your adventures or pushing into endgame PvM, our focus is on supporting your journey with structure, guidance, humour, and a genuinely welcoming environment."
      />

      {/* ── Feature Grid ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-rs-bold text-3xl text-foreground">What we offer</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FeatureCard icon={Trophy} title="Ranking System">
            <p>
              Our ranking system is centred around your PvM achievements, giving you clear goals and
              recognition - both in-game and on Discord - as you advance.
            </p>
            <p>
              From early encounters like <span className="font-semibold text-foreground">Obor</span>,
              all the way through to{" "}
              <span className="font-semibold text-foreground">
                Hard Mode Theatre of Blood
              </span>
              ,{" "}
              <span className="font-semibold text-foreground">
                Challenge Mode Chambers of Xeric
              </span>
              , or even those seeking{" "}
              <span className="font-semibold text-foreground">Radiant and Blorva</span> - there's
              always a next step, and a team ready to help you reach it.
            </p>
          </FeatureCard>

          <FeatureCard icon={GraduationCap} title="Active Mentor Team">
            <p>
              We pride ourselves on having a fully active mentor team covering all areas of the game.
              From entry-level bosses to the most challenging content, experienced players are always
              available to guide, teach, and run content with you.
            </p>
          </FeatureCard>

          <FeatureCard icon={Swords} title="Daily & Weekly Teams">
            <p>
              We run daily teams for{" "}
              <span className="font-semibold text-foreground">Theatre of Blood</span>,{" "}
              <span className="font-semibold text-foreground">Chambers of Xeric</span>, and{" "}
              <span className="font-semibold text-foreground">Tombs of Amascut</span> - so there's
              always something to get stuck into.
            </p>
            <p>
              We also have weekly outings to the Wilderness as a CC, keeping the clan active and
              social at every level.
            </p>
          </FeatureCard>

          <FeatureCard icon={CalendarDays} title="Events & Community">
            <p>
              Our dedicated moderators and events team keep everything running smoothly while
              organising regular events - such as{" "}
              <span className="font-semibold text-foreground">bingos & frenzies</span> - to keep our
              community engaged and thriving.
            </p>
          </FeatureCard>
        </div>
      </section>

      {/* ── Fair Play + Community ─────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FeatureCard icon={ShieldCheck} title="Fair & Trustworthy">
          <p>
            We're committed to maintaining a{" "}
            <span className="font-semibold text-foreground">fair and trustworthy player experience</span>,
            ensuring every member can enjoy the game with confidence and integrity.
          </p>
        </FeatureCard>

        <FeatureCard icon={MessageSquare} title="Always Something On">
          <p>
            Outside the game, we offer a fully featured clan website and a highly active Discord
            where members connect and share achievements.
          </p>
          <p>
            In-game, our clan chat is always lively - making it easy to find teammates or just hang
            out.
          </p>
        </FeatureCard>
      </section>

      {/* ── Closing ──────────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-border bg-card px-8 py-8 text-center">
        <img src={logo} alt="Iron Foundry monogram" className="mx-auto h-16 w-16" />
        <h2 className="font-rs-bold text-3xl text-foreground">No matter your level</h2>
        <p className="mx-auto max-w-2xl leading-relaxed text-mk-body">
          At our core, we're friendly, welcoming, and always willing to help - with a good sense of
          humour. Whether you're here to learn, teach, or just enjoy the grind with like-minded
          players, there's a place for you in Iron Foundry.
        </p>
      </section>
    </div>
  );
}
