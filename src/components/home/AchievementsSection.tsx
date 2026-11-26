import { useState } from "react";
import { Gem, TrendingUp, Zap } from "lucide-react";
import type { Achievement, AchievementType } from "@/types/members";
import { formatGp } from "./StatsSection";

const WIKI = "https://oldschool.runescape.wiki/images";

const ACHIEVEMENT_META: Record<AchievementType, { icon: React.ElementType; color: string; badge: string }> = {
  drop:         { icon: Gem,        color: "text-mk-orange", badge: "Drop" },
  level:        { icon: TrendingUp, color: "text-mk-green",  badge: "Level up" },
  xp_milestone: { icon: Zap,        color: "text-mk-blue",   badge: "XP milestone" },
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
  return <img src={wikiIconUrl(type, label)} alt={label} className="h-5 w-5 shrink-0 object-contain" onError={() => setFailed(true)} />;
}

interface AchievementsSectionProps {
  achievements: Achievement[];
  isLoading: boolean;
}

/** The clan's newest drops, levels and XP milestones, one row each. */
export function AchievementsSection({ achievements, isLoading }: AchievementsSectionProps) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-6">
      <h2 className="mb-3 font-rs-bold text-3xl text-foreground">Recent achievements</h2>
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && achievements.length === 0 && <p className="text-sm text-muted-foreground">No recent achievements yet.</p>}
      <ul className="divide-y divide-border">
        {achievements.map((achievement, i) => {
          const meta = ACHIEVEMENT_META[achievement.type];
          return (
            <li key={i} className="grid grid-cols-achievement-row items-center gap-3 py-2.5 max-sm:grid-cols-icon-row">
              <span title={meta.badge} className={`grid h-8 w-8 place-items-center rounded-lg bg-muted ${meta.color}`}>
                <AchievementIcon type={achievement.type} label={achievement.label} Fallback={meta.icon} className="h-4 w-4" />
              </span>
              <span className="whitespace-nowrap font-semibold">{achievement.player}</span>
              <span className="truncate text-muted-foreground max-sm:hidden">{achievement.label}</span>
              <span className="whitespace-nowrap font-rs-bold">{formatAchievementValue(achievement)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
