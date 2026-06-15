import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { shineHandlers } from "@/hooks/useShineEffect";

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

const mouseTrackHandlers = shineHandlers;

function StatCard({ label, value, backdrop, backdropOpacity = 0.15 }: {
  label: string;
  value: string;
  backdrop?: string;
  backdropOpacity?: number;
}) {
  return (
    <div className="stat-card shine-border" {...mouseTrackHandlers}>
      <Card className="relative overflow-hidden rounded-[10px] border border-border cursor-default">
        {backdrop && (
          <img src={backdrop} alt="" aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{ opacity: backdropOpacity }} />
        )}
        <CardContent className="relative flex flex-col items-center justify-center h-20">
          <span className="text-2xl font-rs-bold text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]">{value}</span>
          <span className="mt-1 text-2xl font-rs-quill text-foreground/60">{label}</span>
        </CardContent>
      </Card>
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

export function StatsSection({ memberCount, clanXp, clanEhb, coxKc, tobKc, toaKc, totalGp, clanPhoto }: StatsSectionProps) {
  const animMemberCount = useCountUp(memberCount);
  const animClanXp = useCountUp(clanXp);
  const animClanEhb = useCountUp(clanEhb);
  const animCoxKc = useCountUp(coxKc);
  const animTobKc = useCountUp(tobKc);
  const animToaKc = useCountUp(toaKc);
  const animTotalGp = useCountUp(totalGp);

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Loot Value" value={animTotalGp !== null ? formatGp(animTotalGp) : "-"}
          backdrop="https://oldschool.runescape.wiki/images/thumb/Loot_Chest_%28opened%29.png/489px-Loot_Chest_%28opened%29.png?b8b83" backdropOpacity={0.25} />
        <StatCard label="Tombs of Amascut" value={animToaKc !== null ? animToaKc.toLocaleString() : "-"}
          backdrop="https://oldschool.runescape.wiki/images/thumb/Tombs_of_Amascut_-_necropolis_concept_art.jpg/640px-Tombs_of_Amascut_-_necropolis_concept_art.jpg?b3e2f" backdropOpacity={0.25} />
        <StatCard label="Chambers of Xeric" value={animCoxKc !== null ? animCoxKc.toLocaleString() : "-"}
          backdrop="https://oldschool.runescape.wiki/images/thumb/Chambers_of_Xeric_artwork.jpg/640px-Chambers_of_Xeric_artwork.jpg?090e1" backdropOpacity={0.25} />
        <StatCard label="Theatre of Blood" value={animTobKc !== null ? animTobKc.toLocaleString() : "-"}
          backdrop="https://oldschool.runescape.wiki/images/thumb/Theatre_of_Blood_artwork.jpg/640px-Theatre_of_Blood_artwork.jpg?92a5f" backdropOpacity={0.25} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Member Count" value={animMemberCount !== null ? animMemberCount.toLocaleString() : "-"}
          backdrop={clanPhoto} backdropOpacity={0.25} />
        <StatCard label="Total XP" value={animClanXp !== null ? formatGp(animClanXp) : "-"}
          backdrop="https://oldschool.runescape.wiki/images/thumb/Forestry-_Part_Two_-_Community_Consultation_%281%29.png/640px-Forestry-_Part_Two_-_Community_Consultation_%281%29.png?b1a37" backdropOpacity={0.25} />
        <StatCard label="Total EHB" value={animClanEhb !== null ? animClanEhb.toLocaleString() : "-"}
          backdrop="https://oldschool.runescape.wiki/images/thumb/Araxxor_artwork_3D_no_text.png/614px-Araxxor_artwork_3D_no_text.png?79f22" backdropOpacity={0.25} />
      </div>
    </section>
  );
}
