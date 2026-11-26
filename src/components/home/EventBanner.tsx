import { Link } from "@tanstack/react-router";
import { Dices, Zap, Clock, ArrowRight, type LucideIcon } from "lucide-react";
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

const ACCENT: Record<Phase, string> = { signups: "text-mk-blue", running: "text-mk-green" };

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
  const Icon = banner.icon;
  const meta = [banner.type, banner.phase === "signups" ? "Signups open" : "Running now", banner.timeText].filter(Boolean);
  return (
    <Link to={banner.to} className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted">
      <Icon className={`h-6 w-6 shrink-0 ${ACCENT[banner.phase]}`} />
      <span className="grid min-w-0 flex-1 gap-0.5">
        <b className="truncate font-rs-bold text-lg font-normal">{banner.name}</b>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {banner.timeText && <Clock className="h-3.5 w-3.5 shrink-0" />}
          {meta.join(" · ")}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {banners.map((b) => (
        <EventBannerCard key={b.key} banner={b} />
      ))}
    </div>
  );
}
