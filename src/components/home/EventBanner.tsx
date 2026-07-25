import { Link } from "@tanstack/react-router";
import { Dices, Zap, Clock, ArrowRight, type LucideIcon } from "lucide-react";
import { useActiveTileraceEvent } from "@/hooks/useTilerace";
import { useActiveEvent } from "@/hooks/useFrenzy";
import type { TileRaceEvent } from "@/types/tilerace";
import type { FrenzyActiveEvent } from "@/types/frenzy";

type Phase = "signups" | "running";

interface Banner {
  key: string;
  name: string;
  phase: Phase;
  timeText: string | null;
  to: string;
  icon: LucideIcon;
}

const accents: Record<Phase, { border: string; bar: string; pill: string; icon: string }> = {
  signups: {
    border: "border-blue-500/40",
    bar: "bg-blue-500",
    pill: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    icon: "text-blue-500",
  },
  running: {
    border: "border-green-500/40",
    bar: "bg-green-500",
    pill: "bg-green-500/15 text-green-600 dark:text-green-400",
    icon: "text-green-500",
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

function tileraceBanner(ev: TileRaceEvent): Banner | null {
  if (ev.is_finished) return null;
  const now = Date.now();
  if (ev.signups_open) {
    return {
      key: `tilerace-${ev.id}`,
      name: ev.name,
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
      phase: "signups",
      timeText: `Starts in ${fmtDuration(start - now)}`,
      to: "/activities/frenzy",
      icon: Zap,
    };
  }
  return {
    key: `frenzy-${ev.id}`,
    name: ev.name,
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
    <Link
      to={banner.to}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border ${a.border} bg-card pl-5 pr-4 py-3 shadow-sm transition-colors hover:bg-accent/40`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${a.bar}`} />
      <Icon className={`h-5 w-5 shrink-0 ${a.icon}`} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-rs-bold text-lg text-primary">{banner.name}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${a.pill}`}>
            {banner.phase === "signups" ? "Signups open" : "Running now"}
          </span>
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
    <div className="space-y-2">
      {banners.map((b) => (
        <EventBannerCard key={b.key} banner={b} />
      ))}
    </div>
  );
}
