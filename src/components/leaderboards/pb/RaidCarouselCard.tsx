import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TeamSizePager, ToaVariantSwitch } from "./RaidCardControls";
import { PbVariantRows, PB_CLAMP } from "./PbVariantRows";
import { PbSheet } from "./PbSheet";
import type { RaidGroup, Grouped } from "@/lib/pbHelpers";

export function RaidCarouselCard({
  group,
  grouped,
  compact,
  exactMatch,
}: {
  group: RaidGroup;
  grouped: Grouped;
  compact: boolean;
  exactMatch?: string;
}): React.ReactElement {
  const [idx, setIdx] = useState(0);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetActivity, setSheetActivity] = useState<string | null>(null);
  const [variantIdx, setVariantIdx] = useState(1);

  const activities = group.activities;
  const safeIdx = Math.min(idx, activities.length - 1);
  const currentActivity = activities[safeIdx]!;
  const variantMap = grouped[currentActivity]!;
  const multi = activities.length > 1;

  const isToaGroup = group.groupKey.startsWith("toa");
  const variantKeys = Object.keys(variantMap).sort();
  const hasVariantToggle = isToaGroup && variantKeys.length > 1;
  const activeKey = variantKeys[variantIdx] ?? variantKeys[0] ?? "";

  useEffect(() => {
    if (!exactMatch) return;
    const matchIdx = group.activities.findIndex((act) =>
      Object.values(grouped[act] ?? {}).flat().some(
        (e) => e.player_name.toLowerCase() === exactMatch,
      ),
    );
    if (matchIdx !== -1) setIdx(matchIdx);
  }, [exactMatch, group.activities, grouped]);

  useEffect(() => { setVariantIdx(1); }, [safeIdx]);

  const effectiveVariantMap = hasVariantToggle
    ? { [activeKey]: variantMap[activeKey] ?? [] }
    : variantMap;

  const totalRows = Object.values(effectiveVariantMap).reduce((s, rows) => s + rows.length, 0);
  const hasMore = Object.values(effectiveVariantMap).some((rows) => rows.length > PB_CLAMP);

  const go = (dir: "left" | "right") => {
    setSlideDir(dir);
    setAnimKey((k) => k + 1);
    setIdx((i) =>
      dir === "left"
        ? (i - 1 + activities.length) % activities.length
        : (i + 1) % activities.length,
    );
  };

  const sheetVarMap = (sheetActivity ? grouped[sheetActivity] : null) ?? effectiveVariantMap;
  const sheetTitle = sheetActivity ?? currentActivity;

  return (
    <>
      <div className="rounded-xl border border-border bg-card">
        <div className={cn("flex items-center justify-between gap-2", compact ? "px-2 pt-1.5 pb-0.5" : "px-3 pt-2.5 pb-1")}>
          <span title={currentActivity} className={cn("font-rs-bold text-primary leading-tight truncate", compact ? "text-sm" : "text-base")}>
            {currentActivity}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {hasVariantToggle && <ToaVariantSwitch value={variantIdx} onChange={setVariantIdx} />}
            {multi && <TeamSizePager index={safeIdx} total={activities.length} onStep={go} />}
          </div>
        </div>

        <div className={cn("overflow-hidden", compact ? "px-2 pb-1.5" : "px-3 pb-2.5")}>
          <div
            key={animKey}
            className={cn(
              slideDir !== null && "animate-in fade-in-0 duration-200",
              slideDir === "right" && "slide-in-from-right-3",
              slideDir === "left" && "slide-in-from-left-3",
            )}
          >
            <PbVariantRows variantMap={effectiveVariantMap} clamp compact={compact} exactMatch={exactMatch} />
          </div>
          {hasMore && (
            <button
              onClick={() => { setSheetActivity(currentActivity); setSheetOpen(true); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border pt-1.5 text-center mt-1"
            >
              View all {totalRows} records
            </button>
          )}
        </div>
      </div>
      <PbSheet open={sheetOpen} onOpenChange={setSheetOpen} title={sheetTitle} variantMap={sheetVarMap} />
    </>
  );
}
