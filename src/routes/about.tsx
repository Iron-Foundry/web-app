import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <Card>
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary shrink-0" />
          <h3 className="font-rs-bold text-lg text-primary">{title}</h3>
        </div>
        <div className="text-sm leading-relaxed text-muted-foreground space-y-2">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 py-6">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h1 className="font-rs-bold text-5xl text-primary">About Us</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          We're a community-driven clan built for Ironmen and Ironwomen who want to progress, improve,
          and enjoy every stage of the game together. Whether you're just starting out on your
          adventures or pushing into endgame PvM, our focus is on supporting your journey with
          structure, guidance, humour, and a genuinely welcoming environment.
        </p>
      </section>

      <Separator />

      {/* ── Feature Grid ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-rs-bold text-3xl text-primary">What we offer</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FeatureCard icon={Trophy} title="Ranking System">
            <p>
              Our ranking system is centred around your PvM achievements, giving you clear goals and
              recognition - both in-game and on Discord - as you advance.
            </p>
            <p>
              From early encounters like <span className="text-foreground font-medium">Obor</span>,
              all the way through to{" "}
              <span className="text-foreground font-medium">
                Hard Mode Theatre of Blood
              </span>
              ,{" "}
              <span className="text-foreground font-medium">
                Challenge Mode Chambers of Xeric
              </span>
              , or even those seeking{" "}
              <span className="text-foreground font-medium">Radiant and Blorva</span> - there's
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
              <span className="text-foreground font-medium">Theatre of Blood</span>,{" "}
              <span className="text-foreground font-medium">Chambers of Xeric</span>, and{" "}
              <span className="text-foreground font-medium">Tombs of Amascut</span> - so there's
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
              <span className="text-foreground font-medium">bingos & frenzies</span> - to keep our
              community engaged and thriving.
            </p>
          </FeatureCard>
        </div>
      </section>

      <Separator />

      {/* ── Fair Play + Community ─────────────────────────────── */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <FeatureCard icon={ShieldCheck} title="Fair & Trustworthy">
          <p>
            We're committed to maintaining a{" "}
            <span className="text-foreground font-medium">fair and trustworthy player experience</span>,
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

      <Separator />

      {/* ── Closing ──────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card px-8 py-8 text-center space-y-3">
        <h2 className="font-rs-bold text-3xl text-primary">No matter your level</h2>
        <p className="mx-auto max-w-2xl leading-relaxed text-muted-foreground">
          At our core, we're friendly, welcoming, and always willing to help - with a good sense of
          humour. Whether you're here to learn, teach, or just enjoy the grind with like-minded
          players, there's a place for you in Iron Foundry.
        </p>
      </section>
    </div>
  );
}
