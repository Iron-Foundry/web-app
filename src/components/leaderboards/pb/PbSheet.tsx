import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { rankLabel, formatTime } from "@/components/leaderboards/RankRow";
import { resolveFilterRank, GEM_RANK_COLOR } from "@/lib/leaderboardRanks";
import { cn } from "@/lib/utils";
import type { PbEntry } from "@/types/leaderboard";

type SheetItem =
  | { kind: "variant-header"; label: string }
  | { kind: "col-header" }
  | { kind: "row"; entry: PbEntry; rank: number };

const SHEET_ITEM_HEIGHT: Record<SheetItem["kind"], number> = {
  "variant-header": 32,
  "col-header":     28,
  "row":            37,
};

const GRID = "grid-cols-[2rem_1fr_5rem_5rem]";

function buildSheetItems(variantMap: Record<string, PbEntry[]>): SheetItem[] {
  const variants = Object.keys(variantMap).sort();
  const hasNamedVariants = variants.some((v) => v !== "");
  const items: SheetItem[] = [];
  for (const variant of variants) {
    const rows = variantMap[variant] ?? [];
    if (hasNamedVariants && variant) items.push({ kind: "variant-header", label: variant });
    items.push({ kind: "col-header" });
    rows.forEach((entry, i) => items.push({ kind: "row", entry, rank: i + 1 }));
  }
  return items;
}

function PbSheetList({ variantMap }: { variantMap: Record<string, PbEntry[]> }): React.ReactElement {
  const items = buildSheetItems(variantMap);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => SHEET_ITEM_HEIGHT[(items[i]?.kind ?? "row") as SheetItem["kind"]],
    overscan: 20,
  });

  return (
    <div ref={parentRef} className="overflow-y-auto flex-1 px-6">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const item = items[vItem.index]!;
          return (
            <div
              key={vItem.key}
              data-index={vItem.index}
              ref={virtualizer.measureElement}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vItem.start}px)` }}
            >
              {item.kind === "variant-header" && (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-4 pb-1">
                  {item.label}
                </p>
              )}
              {item.kind === "col-header" && (
                <div className={cn("grid gap-x-4 border-b border-border pb-1 text-xs text-muted-foreground", GRID)}>
                  <span>Rank</span>
                  <span>Player</span>
                  <span>CC Rank</span>
                  <div className="flex justify-end">Time</div>
                </div>
              )}
              {item.kind === "row" && (() => {
                const gemRank = resolveFilterRank(item.entry);
                return (
                  <div className={cn("grid gap-x-4 items-center border-b border-border last:border-0 hover:bg-muted/40 rounded-sm py-1.5", GRID)}>
                    <span className="text-xs text-muted-foreground">{rankLabel(item.rank)}</span>
                    <span className="font-medium text-foreground truncate">{item.entry.player_name}</span>
                    <span className={cn("text-xs shrink-0", gemRank ? GEM_RANK_COLOR[gemRank] : "text-muted-foreground/30")}>
                      {gemRank ?? "-"}
                    </span>
                    <div className="flex justify-end">
                      <Badge variant="secondary" className="font-rs-bold tabular-nums text-xs">
                        {formatTime(item.entry.time_seconds)}
                      </Badge>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PbSheet({
  open,
  onOpenChange,
  title,
  variantMap,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  variantMap: Record<string, PbEntry[]>;
}): React.ReactElement {
  const total = Object.values(variantMap).reduce((s, r) => s + r.length, 0);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="font-rs-bold text-primary text-lg leading-tight">{title}</SheetTitle>
          <p className="text-xs text-muted-foreground">{total.toLocaleString()} records</p>
        </SheetHeader>
        <PbSheetList variantMap={variantMap} />
      </SheetContent>
    </Sheet>
  );
}
