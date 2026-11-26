import { useEffect, useRef, useState } from "react";
import { Clock, Coins, Shield, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function useCountUp(target: number | null, duration = 1200): number | null {
  const [current, setCurrent] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) return;
    setCurrent(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return current;
}

export function formatGp(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toLocaleString();
}

const WIKI = "https://oldschool.runescape.wiki/images/thumb";

function StatTile({ label, value, icon: Icon, art, artAlt, tone }: {
  label: string;
  value: string;
  icon: LucideIcon;
  art: string;
  artAlt: string;
  tone: string;
}): React.ReactElement {
  return (
    <div className="relative flex min-h-34 flex-col justify-between gap-6 overflow-hidden rounded-xl border border-border bg-card px-5 py-4">
      <img src={art} alt={artAlt} className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-linear-to-t from-card from-10% to-transparent to-75%" />
      <span className="relative flex items-center gap-2 text-sm text-muted-foreground"><Icon className={cn("h-4 w-4", tone)} />{label}</span>
      <b className={cn("relative font-rs-bold text-4xl font-normal leading-none", tone)}>{value}</b>
    </div>
  );
}

interface StatsSectionProps {
  memberCount: number | null;
  clanXp: number | null;
  clanEhb: number | null;
  coxKc: number | null;
  tobKc: number | null;
  toaKc: number | null;
  totalGp: number | null;
  clanPhoto: string;
}

const show = (n: number | null, fmt: (v: number) => string): string => (n === null ? "-" : fmt(n));
const count = (v: number): string => v.toLocaleString();

/** The seven clan figures, each counting up from zero once its value arrives. */
export function StatsSection({ memberCount, clanXp, clanEhb, coxKc, tobKc, toaKc, totalGp, clanPhoto }: StatsSectionProps) {
  const members = useCountUp(memberCount);
  const xp = useCountUp(clanXp);
  const ehb = useCountUp(clanEhb);
  const cox = useCountUp(coxKc);
  const tob = useCountUp(tobKc);
  const toa = useCountUp(toaKc);
  const gp = useCountUp(totalGp);

  return (
    <section className="space-y-5">
      <h2 className="font-rs-bold text-3xl text-foreground">Clan stats</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Members" value={show(members, count)} icon={Users} tone="text-mk-orange" art={clanPhoto} artAlt="Iron Foundry clan photograph" />
        <StatTile label="Total XP" value={show(xp, formatGp)} icon={TrendingUp} tone="text-mk-yellow" art={`${WIKI}/Forestry-_Part_Two_-_Community_Consultation_%281%29.png/640px-Forestry-_Part_Two_-_Community_Consultation_%281%29.png?b1a37`} artAlt="Forestry artwork" />
        <StatTile label="Total EHB" value={show(ehb, count)} icon={Clock} tone="text-mk-teal" art={`${WIKI}/Araxxor_artwork_3D_no_text.png/614px-Araxxor_artwork_3D_no_text.png?79f22`} artAlt="Araxxor artwork" />
        <StatTile label="Loot value" value={show(gp, formatGp)} icon={Coins} tone="text-mk-green" art={`${WIKI}/Loot_Chest_%28opened%29.png/489px-Loot_Chest_%28opened%29.png?b8b83`} artAlt="Opened loot chest" />
        <StatTile label="Chambers of Xeric" value={show(cox, count)} icon={Shield} tone="text-mk-blue" art={`${WIKI}/Chambers_of_Xeric_artwork.jpg/640px-Chambers_of_Xeric_artwork.jpg?090e1`} artAlt="Chambers of Xeric artwork" />
        <StatTile label="Theatre of Blood" value={show(tob, count)} icon={Shield} tone="text-mk-red" art={`${WIKI}/Theatre_of_Blood_artwork.jpg/640px-Theatre_of_Blood_artwork.jpg?92a5f`} artAlt="Theatre of Blood artwork" />
        <StatTile label="Tombs of Amascut" value={show(toa, count)} icon={Shield} tone="text-mk-purple" art={`${WIKI}/Tombs_of_Amascut_-_necropolis_concept_art.jpg/640px-Tombs_of_Amascut_-_necropolis_concept_art.jpg?b3e2f`} artAlt="Tombs of Amascut concept art" />
      </div>
    </section>
  );
}
