import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton({ rows = 5, compact = false }: { rows?: number; compact?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <Skeleton className={compact ? "h-4 w-24" : "h-5 w-32"} />
      <div className="space-y-1.5">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className={compact ? "h-5 w-full" : "h-7 w-full"} />
        ))}
      </div>
    </div>
  );
}

/** Grid of cards - used for PB / KC tabs. */
export function LeaderboardSkeleton({ compact = false }: { compact?: boolean }) {
  const cols = compact ? 5 : 3;
  return (
    <div className={`grid gap-4 grid-cols-1 md:grid-cols-${cols}`}>
      {Array.from({ length: cols * 2 }, (_, i) => (
        <CardSkeleton key={i} compact={compact} />
      ))}
    </div>
  );
}

/** Single-card list skeleton - used for Clog / Leagues tabs. */
export function LeaderboardListSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      {Array.from({ length: compact ? 20 : 15 }, (_, i) => (
        <Skeleton key={i} className={compact ? "h-5 w-full" : "h-7 w-full"} />
      ))}
    </div>
  );
}

/** Ranking tab skeleton - stats bar + table. */
export function RankingTabSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
            <Skeleton className="h-3 w-24 mx-auto" />
            <Skeleton className={`${compact ? "h-6" : "h-8"} w-16 mx-auto`} />
          </div>
        ))}
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/50 p-2">
          <Skeleton className="h-4 w-48" />
        </div>
        {Array.from({ length: compact ? 20 : 15 }, (_, i) => (
          <div key={i} className="border-t border-border px-3 py-1.5 flex gap-4">
            <Skeleton className="h-4 w-6 shrink-0" />
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-4 w-16 shrink-0" />
            <Skeleton className="h-4 w-16 shrink-0" />
            <Skeleton className="h-4 w-12 ml-auto shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
