import { Fragment } from "react";
import { useMySnapshot } from "@/hooks/useMemberDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function formatXp(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  return v.toLocaleString();
}

function formatEfficiency(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function metricDisplayName(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Shows WOM-sourced overall XP, top skills, top boss KC and ironman efficiency for a given RSN. */
export function WomSnapshotCard({ rsn }: { rsn: string | null | undefined }): React.JSX.Element | null {
  const { data: snapshot } = useMySnapshot(rsn);

  if (!snapshot || !rsn) return null;

  const overallXp = snapshot.skills["overall"] ?? 0;

  const topSkills = Object.entries(snapshot.skills)
    .filter(([name, xp]) => name !== "overall" && xp > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key, xp]) => ({ name: metricDisplayName(key), xp }));

  const topBosses = Object.entries(snapshot.bosses)
    .filter(([, kc]) => kc > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key, kc]) => ({ name: metricDisplayName(key), kc }));

  const hasEfficiency = snapshot.ehp !== null || snapshot.ehb !== null;

  if (overallXp === 0 && topSkills.length === 0 && topBosses.length === 0 && !hasEfficiency) return null;

  const sections: React.JSX.Element[] = [];

  if (overallXp > 0) {
    sections.push(
      <div key="overall" className="space-y-0.5">
        <p className="text-xs text-muted-foreground">Overall XP</p>
        <p className="text-sm font-semibold text-foreground">{formatXp(overallXp)}</p>
      </div>,
    );
  }

  if (topSkills.length > 0) {
    sections.push(
      <div key="skills" className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Top Skills</p>
        <div className="space-y-1">
          {topSkills.map(({ name, xp }) => (
            <div key={name} className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground truncate">{name}</span>
              <span className="text-sm tabular-nums text-muted-foreground shrink-0">{formatXp(xp)}</span>
            </div>
          ))}
        </div>
      </div>,
    );
  }

  if (topBosses.length > 0) {
    sections.push(
      <div key="bosses" className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Top Bosses</p>
        <div className="space-y-1">
          {topBosses.map(({ name, kc }) => (
            <div key={name} className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground truncate">{name}</span>
              <span className="text-sm tabular-nums text-muted-foreground shrink-0">{kc.toLocaleString()} kc</span>
            </div>
          ))}
        </div>
      </div>,
    );
  }

  if (hasEfficiency) {
    sections.push(
      <div key="efficiency" className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Ironman EHP</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {snapshot.ehp === null ? "-" : formatEfficiency(snapshot.ehp)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Ironman EHB</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {snapshot.ehb === null ? "-" : formatEfficiency(snapshot.ehb)}
          </p>
        </div>
      </div>,
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">WOM Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sections.map((section, index) => (
          <Fragment key={section.key}>
            {index > 0 && <Separator />}
            {section}
          </Fragment>
        ))}
      </CardContent>
    </Card>
  );
}
