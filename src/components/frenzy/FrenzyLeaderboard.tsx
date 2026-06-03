import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFrenzyLeaderboards } from "@/hooks/useFrenzy";

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
        <Card key={board.metric}>
          <CardHeader className="pb-2 pt-3 px-4">
            <h3 className="font-semibold text-sm">{board.display_name}</h3>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1">
              {board.entries.map((entry) => (
                <div key={entry.rsn} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-5 text-right shrink-0">
                      {entry.index}.
                    </span>
                    <span className="font-medium truncate">{entry.rsn}</span>
                  </div>
                  <span className="text-muted-foreground shrink-0">
                    {entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
