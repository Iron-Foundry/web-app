import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { LootSourceRow } from "@/api/osrsclans";
import { measuredBy } from "@/lib/frenzyCard";
import { sourceLabel } from "@/lib/lootTable";

const ROW_HEIGHT = 37;
const HEAD = "text-xs font-medium text-muted-foreground";

interface Props {
  sources: LootSourceRow[];
  hasMore: boolean;
  onNearEnd: () => void;
  onOpen: (source: LootSourceRow) => void;
}

function KillsCell({ source }: { source: LootSourceRow }): React.ReactElement {
  if (source.kills_per_hour == null) return <span className="text-yellow-500">No rate</span>;
  return <>{source.kills_per_hour.toLocaleString(undefined, { maximumFractionDigits: 2 })}</>;
}

function SourceRowButton({ source, onOpen }: { source: LootSourceRow; onOpen: () => void }): React.ReactElement {
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/20">
      <span className="min-w-0 flex-1 truncate">{sourceLabel(source.source)}</span>
      <span className="w-20 shrink-0 text-right tabular-nums">
        <KillsCell source={source} />
      </span>
      <span className="w-28 shrink-0 truncate text-muted-foreground">{measuredBy(source.kill_rate_source)}</span>
    </button>
  );
}

/** The drop sources of a tab as one virtual list that asks for more near its end. */
export function SourceList({ sources, hasMore, onNearEnd, onOpen }: Props): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: sources.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });
  const lastIndex = virtualizer.getVirtualItems().at(-1)?.index ?? 0;

  useEffect(() => {
    if (hasMore && lastIndex >= sources.length - 10) onNearEnd();
  }, [hasMore, lastIndex, sources.length, onNearEnd]);

  return (
    <div className="rounded-md border border-border">
      <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-3 py-2">
        <span className={`${HEAD} flex-1`}>Source</span>
        <span className={`${HEAD} w-20 text-right`}>Kills/h</span>
        <span className={`${HEAD} w-28`}>Measured by</span>
      </div>
      <div ref={scrollRef} className="h-96 overflow-y-auto">
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((item) => {
            const source = sources[item.index]!;
            return (
              <div
                key={source.source}
                className="absolute left-0 top-0 w-full border-b border-border"
                style={{ transform: `translateY(${item.start}px)` }}
              >
                <SourceRowButton source={source} onOpen={() => onOpen(source)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
