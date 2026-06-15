import { useEffect, useRef, useState } from "react";
import { Gem, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Achievement, AchievementType } from "@/types/members";
import { formatGp } from "./StatsSection";
import { shineHandlers } from "@/hooks/useShineEffect";

const WIKI = "https://oldschool.runescape.wiki/images";

const ACHIEVEMENT_META: Record<AchievementType, { icon: React.ElementType; color: string; badge: string; accent: string }> = {
  drop:         { icon: Gem,        color: "text-primary",   badge: "Drop",         accent: "border-l-primary/60" },
  level:        { icon: TrendingUp, color: "text-green-400", badge: "Level Up",     accent: "border-l-green-400/60" },
  xp_milestone: { icon: Zap,        color: "text-blue-400",  badge: "XP Milestone", accent: "border-l-blue-400/60" },
};

function wikiIconUrl(type: AchievementType, label: string): string {
  if (label === "Total Level") return `${WIKI}/Stats_icon.png`;
  const slug = label.replace(/ /g, "_");
  if (type === "drop") return `${WIKI}/${slug}.png`;
  return `${WIKI}/${slug}_icon.png`;
}

function formatAchievementValue(a: Achievement): string {
  switch (a.type) {
    case "drop": return formatGp(a.value);
    case "level": return `Level ${a.value}`;
    case "xp_milestone": return `${formatGp(a.value)} xp`;
  }
}

function AchievementIcon({ type, label, Fallback, className }: {
  type: AchievementType;
  label: string;
  Fallback: React.ElementType;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Fallback className={className} />;
  return (
    <img src={wikiIconUrl(type, label)} alt="" className="h-4 w-4 shrink-0 object-contain" onError={() => setFailed(true)} />
  );
}

interface AchievementsSectionProps {
  achievements: Achievement[];
  isLoading: boolean;
}

export function AchievementsSection({ achievements, isLoading }: AchievementsSectionProps) {
  const [visible, setVisible] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [achievements.length]);

  return (
    <section className="space-y-4">
      <h2 className="font-rs-bold text-3xl text-primary">Recent Achievements</h2>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Loading...</p>
          ) : achievements.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No recent achievements yet.</p>
          ) : (
            <ul ref={listRef} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 px-2 py-0.5 ${visible ? "achievements-visible" : ""}`}>
              {achievements.map((achievement, i) => {
                const meta = ACHIEVEMENT_META[achievement.type];
                const Icon = meta.icon;
                return (
                  <li
                    key={i}
                    className="achievement-card shine-border rounded-md"
                    style={{ "--cascade-delay": `${i * 60}ms`, "--tl-opacity": `${1 - (i / achievements.length) * 0.5}` } as React.CSSProperties}
                    {...shineHandlers}
                  >
                    <div className={`flex items-center gap-3 rounded-[4px] border border-border border-l-2 ${meta.accent} bg-card px-3 py-2.5 w-full`}>
                      <AchievementIcon type={achievement.type} label={achievement.label} Fallback={Icon} className={`h-5 w-5 shrink-0 ${meta.color}`} />
                      <span className="text-sm font-semibold text-foreground truncate hidden sm:block">{achievement.label}</span>
                      <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-primary font-medium">{achievement.player}</span>
                      <span className={`ml-auto shrink-0 font-rs-bold text-sm ${meta.color}`}>{formatAchievementValue(achievement)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
