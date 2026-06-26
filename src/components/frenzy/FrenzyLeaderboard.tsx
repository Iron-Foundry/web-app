import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFrenzyLeaderboards } from "@/hooks/useFrenzy";
import { shineHandlers } from "@/hooks/useShineEffect";

const RANK_BADGE: Record<number, string> = {
  1: "bg-yellow-500/20 text-yellow-600 border border-yellow-500/40",
  2: "bg-slate-400/20 text-slate-500 border border-slate-400/40",
  3: "bg-amber-700/20 text-amber-700 border border-amber-700/40",
};

export function FrenzyLeaderboard() {
  const { data, isLoading } = useFrenzyLeaderboards();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-40 p-4" />
          </Card>
        ))}
      </div>
    );
  }

  const boards = data?.data ?? [];

  if (boards.length === 0) {
    if ((data?.pending_metrics?.length ?? 0) > 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Leaderboard data is loading, check back shortly.
        </p>
      );
    }
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <div key={board.metric} className="shine-border rounded-xl" {...shineHandlers}>
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <h3 className="font-semibold text-sm">{board.display_name}</h3>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-0.5">
                {board.entries.map((entry, i) => (
                  <div
                    key={entry.rsn}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                      i % 2 === 0 ? "bg-muted/30" : ""
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0 ${
                        RANK_BADGE[entry.index] ?? "text-muted-foreground"
                      }`}
                    >
                      {entry.index}
                    </span>
                    <span className="font-medium truncate flex-1">{entry.rsn}</span>
                    <span className="text-muted-foreground shrink-0">
                      {entry.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
