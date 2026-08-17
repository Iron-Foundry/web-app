import { Card } from "@/components/ui/card";
import type { TileRaceRecapTotals } from "@/types/tilerace";

interface Stat {
  key: string;
  value: string;
  note: string;
}

function buildStats(totals: TileRaceRecapTotals): Stat[] {
  const reviewed = totals.approved + totals.rejected;
  const rate = reviewed ? Math.round((totals.approved / reviewed) * 100) : 0;
  return [
    {
      key: "Teams",
      value: `${totals.teams}`,
      note: `${totals.racers} racers at close`,
    },
    {
      key: "Tiles cleared",
      value: `${totals.tiles_cleared}`,
      note: "claimed or approved",
    },
    {
      key: "Proofs approved",
      value: `${totals.approved}`,
      note: `of ${totals.submitted} submitted`,
    },
    { key: "Dice rolled", value: `${totals.rolls}`, note: "across every team" },
    {
      key: "Approval rate",
      value: `${rate}%`,
      note: `${totals.rejected} rejected, ${totals.unreviewed} unreviewed`,
    },
  ];
}

interface Props {
  totals: TileRaceRecapTotals;
}

export function RecapStats({ totals }: Props): JSX.Element {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {buildStats(totals).map((stat) => (
        <Card key={stat.key} className="p-4 gap-1">
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">
            {stat.key}
          </p>
          <p className="text-2xl font-bold leading-tight">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.note}</p>
        </Card>
      ))}
    </div>
  );
}
