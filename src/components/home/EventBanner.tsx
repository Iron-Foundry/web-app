import { Link } from "@tanstack/react-router";
import { Dices, Zap, Clock, ArrowRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { shineHandlers } from "@/hooks/useShineEffect";
import { useActiveTileraceEvent } from "@/hooks/useTilerace";
import { useActiveEvent } from "@/hooks/useFrenzy";
import type { TileRacePublicEvent } from "@/types/tilerace";
import type { FrenzyActiveEvent } from "@/types/frenzy";

type Phase = "signups" | "running";

interface Banner {
  key: string;
  name: string;
  type: string;
  phase: Phase;
  timeText: string | null;
  to: string;
  icon: LucideIcon;
}

const accents: Record<Phase, { icon: string; pill: string }> = {
  signups: {
    icon: "text-blue-500",
    pill: "bg-blue-700/20 text-blue-800 dark:text-blue-300",
  },
  running: {
    icon: "text-green-500",
    pill: "bg-green-700/20 text-green-800 dark:text-green-400",
  },
};

function fmtDuration(ms: number): string {
  if (ms <= 0) return "soon";
  const days = Math.floor(ms / 86_400_000);
  if (days > 0) return `${days}d`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours > 0) return `${hours}h`;
  return `${Math.max(1, Math.floor(ms / 60_000))}m`;
}

function tileraceBanner(ev: TileRacePublicEvent): Banner | null {
  if (ev.is_finished) return null;
  const now = Date.now();
  if (ev.signups_open) {
    return {
      key: `tilerace-${ev.id}`,
      name: ev.name,
      type: "Tilerace",
      phase: "signups",
      timeText: ev.starts_at ? `Starts in ${fmtDuration(new Date(ev.starts_at).getTime() - now)}` : null,
      to: "/activities/tilerace",
      icon: Dices,
    };
  }
  if (ev.is_active) {
    return {
      key: `tilerace-${ev.id}`,
      name: ev.name,
      type: "Tilerace",
      phase: "running",
      timeText: ev.ends_at ? `Ends in ${fmtDuration(new Date(ev.ends_at).getTime() - now)}` : null,
      to: "/activities/tilerace",
      icon: Dices,
    };
  }
  return null;
}

function frenzyBanner(ev: FrenzyActiveEvent): Banner | null {
  const now = Date.now();
  const start = ev.starts_at ? new Date(ev.starts_at).getTime() : null;
  const end = ev.ends_at ? new Date(ev.ends_at).getTime() : null;
  if (end && now > end) return null;
  if (start && now < start) {
    return {
      key: `frenzy-${ev.id}`,
      name: ev.name,
      type: "Frenzy",
      phase: "signups",
      timeText: `Starts in ${fmtDuration(start - now)}`,
      to: "/activities/frenzy",
      icon: Zap,
    };
  }
  return {
    key: `frenzy-${ev.id}`,
    name: ev.name,
    type: "Frenzy",
    phase: "running",
    timeText: end ? `Ends in ${fmtDuration(end - now)}` : null,
    to: "/activities/frenzy",
    icon: Zap,
  };
}

function EventBannerCard({ banner }: { banner: Banner }): JSX.Element {
  const a = accents[banner.phase];
  const Icon = banner.icon;
  return (
    <div className="stat-card shine-border" {...shineHandlers}>
      <Card className="relative overflow-hidden rounded-[10px] border border-border py-0">
        <Link to={banner.to} className="group flex items-center gap-3 px-4 py-3">
          <Icon className={`h-5 w-5 shrink-0 ${a.icon}`} />
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="truncate font-rs-bold text-lg text-primary">{banner.name}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${a.pill}`}>
                {banner.phase === "signups" ? "Signups open" : "Running now"}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{"•"} {banner.type}</span>
            </div>
            {banner.timeText && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                {banner.timeText}
              </span>
            )}
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Card>
    </div>
  );
}

export function EventBanner(): JSX.Element | null {
  const { data: tilerace } = useActiveTileraceEvent();
  const { data: frenzy } = useActiveEvent();

  const banners = [
    tilerace ? tileraceBanner(tilerace) : null,
    frenzy ? frenzyBanner(frenzy) : null,
  ].filter((b): b is Banner => b !== null);

  if (banners.length === 0) return null;

  return (
    <div className="mx-auto w-2/3 space-y-2">
      {banners.map((b) => (
        <EventBannerCard key={b.key} banner={b} />
      ))}
    </div>
  );
}
