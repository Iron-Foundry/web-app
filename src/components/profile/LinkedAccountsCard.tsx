import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Star, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAccounts } from "@/api/accounts";
import { useAuth } from "@/context/AuthContext";
import { useMyRankings } from "@/hooks/useMemberDashboard";
import type { AccountRanking } from "@/types/members";

/** Read-only list of the current user's linked RSNs with ranking stats. Manage link goes to Settings. */
export function LinkedAccountsCard(): React.JSX.Element {
  const { user } = useAuth();
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["members", "accounts"],
    queryFn: getAccounts,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
  const { data: rankings = [] } = useMyRankings(user?.discord_user_id);

  function rankingForRsn(rsn: string): AccountRanking | undefined {
    return rankings.find((r) => r.rsn.toLowerCase() === rsn.toLowerCase());
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Linked Accounts</CardTitle>
          <Link
            to="/members/settings"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-3 w-3" />
            Manage
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : accounts.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No accounts linked.</p>
            <Link to="/members/settings" className="text-sm text-primary underline underline-offset-2">
              Link an RSN in Settings
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc) => {
              const ranking = rankingForRsn(acc.rsn);
              return (
                <div
                  key={acc.id}
                  className="rounded-md border border-border px-3 py-2 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "text-sm truncate",
                      acc.is_primary ? "font-medium text-foreground" : "text-muted-foreground",
                    )}>
                      {acc.rsn}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ranking?.rank && (
                        <span className="text-xs text-muted-foreground">{ranking.rank}</span>
                      )}
                      {acc.is_primary && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                          <Star className="h-2.5 w-2.5" />
                          primary
                        </Badge>
                      )}
                    </div>
                  </div>
                  {ranking?.points != null && (
                    <p className="text-xs text-muted-foreground">
                      {ranking.points.toLocaleString()} pts
                      {ranking.boss_points != null && ` · ${ranking.boss_points.toLocaleString()} boss`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
