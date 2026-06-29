import { useState } from "react";
import { cn } from "@/lib/utils";
import { PbVariantRows, PB_CLAMP } from "./PbVariantRows";
import { PbSheet } from "./PbSheet";
import type { PbEntry } from "@/types/leaderboard";

type VariantMap = Record<string, PbEntry[]>;

export function NonRaidCard({
  activity,
  variantMap,
  compact,
  exactMatch,
}: {
  activity: string;
  variantMap: VariantMap;
  compact: boolean;
  exactMatch?: string;
}): React.ReactElement {
  const [sheetOpen, setSheetOpen] = useState(false);
  const totalRows = Object.values(variantMap).reduce((s, rows) => s + rows.length, 0);
  const hasMore = Object.values(variantMap).some((rows) => rows.length > PB_CLAMP);

  return (
    <>
      <div className="rounded-md border border-border bg-card">
        <div title={activity} className={cn("font-rs-bold text-primary truncate", compact ? "px-2 pt-1.5 pb-0.5 text-sm" : "px-3 pt-2.5 pb-1 text-base")}>
          {activity}
        </div>
        <div className={compact ? "px-2 pb-1.5" : "px-3 pb-2.5"}>
          <PbVariantRows variantMap={variantMap} clamp compact={compact} exactMatch={exactMatch} />
          {hasMore && (
            <button
              onClick={() => setSheetOpen(true)}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border pt-1.5 text-center mt-1"
            >
              View all {totalRows} records
            </button>
          )}
        </div>
      </div>
      <PbSheet open={sheetOpen} onOpenChange={setSheetOpen} title={activity} variantMap={variantMap} />
    </>
  );
}
