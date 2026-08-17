import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { RecapCard } from "./RecapCard";
import { RecapTooltip } from "./RecapTooltip";
import { buildCumulativeRows } from "@/lib/tilerace-recap";
import type { TileRaceRecapTeam } from "@/types/tilerace";

interface Props {
  teams: TileRaceRecapTeam[];
}

export function CumulativeChart({ teams }: Props): JSX.Element {
  const rows = buildCumulativeRows(teams);
  const names = Object.fromEntries(teams.map((t) => [t.slug, t.name]));

  return (
    <RecapCard
      title="Approved proofs, cumulative"
      description="Only proofs from racers still on the roster at close."
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No proofs were filed for this event.
        </p>
      ) : (
        <ChartContainer config={{}} className="h-[240px] w-full">
          <LineChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={36}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<RecapTooltip names={names} />} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={8}
              formatter={(value) => names[String(value)] ?? value}
            />
            {teams.map((team) => (
              <Line
                key={team.id}
                type="monotone"
                dataKey={team.slug}
                stroke={team.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      )}
    </RecapCard>
  );
}
