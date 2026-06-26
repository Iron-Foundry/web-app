import { useMySnapshot } from "@/hooks/useMemberDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function formatXp(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  return v.toLocaleString();
}

function bossDisplayName(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Shows WOM-sourced total XP and top boss KC for a given RSN. */
export function WomSnapshotCard({ rsn }: { rsn: string | null | undefined }): React.JSX.Element | null {
  const { data: snapshot } = useMySnapshot(rsn);

  if (!snapshot || !rsn) return null;

  const totalXp = snapshot.skills["overall"] ?? 0;

  const topBosses = Object.entries(snapshot.bosses)
    .filter(([, kc]) => kc > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key, kc]) => ({ name: bossDisplayName(key), kc }));

  if (totalXp === 0 && topBosses.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">WOM Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {totalXp > 0 && (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Total XP</p>
            <p className="text-sm font-semibold text-foreground">{formatXp(totalXp)}</p>
          </div>
        )}
        {totalXp > 0 && topBosses.length > 0 && <Separator />}
        {topBosses.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Top Bosses</p>
            <div className="space-y-1">
              {topBosses.map(({ name, kc }) => (
                <div key={name} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground truncate">{name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground shrink-0">{kc.toLocaleString()} kc</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
