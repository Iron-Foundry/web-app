import { Bell } from "lucide-react";
import { argbToCss } from "@/components/map/runeliteTiles";
import type { BossHealthData } from "@/types/runeliteConfig";

function formatPct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

function clampPct(fraction: number): number {
  return Math.max(0, Math.min(100, fraction * 100));
}

export function BossHealthDisplay({ bosses }: { bosses: BossHealthData[] }) {
  return (
    <div className="space-y-3">
      {bosses.map((boss, bossIndex) => {
        const entries = [...boss.entries].sort((a, b) => b.percentage - a.percentage);
        return (
          <div key={bossIndex} className="space-y-1.5">
            <p className="truncate font-rs-bold text-sm text-primary leading-tight">
              {boss.bossName}
            </p>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-border bg-muted">
              {entries.map((entry, entryIndex) => (
                <span
                  key={entryIndex}
                  className="absolute top-0 h-full w-1 -translate-x-1/2"
                  style={{
                    left: `${clampPct(entry.percentage)}%`,
                    backgroundColor: argbToCss(entry.color),
                  }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {entries.map((entry, entryIndex) => (
                <span
                  key={entryIndex}
                  className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm border border-black/20"
                    style={{ backgroundColor: argbToCss(entry.color) }}
                  />
                  {formatPct(entry.percentage)}
                  {entry.notify && <Bell className="h-2.5 w-2.5 text-primary" />}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
