import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { RecapCard } from "./RecapCard";
import { RecapTooltip } from "./RecapTooltip";
import { buildDailyRows, formatRecapDay } from "@/lib/tilerace-recap";
import type { TileRaceRecapTeam } from "@/types/tilerace";

const VERDICT_COLORS: Record<string, string> = {
  approved: "hsl(142 71% 45%)",
  rejected: "var(--destructive)",
  unreviewed: "var(--muted-foreground)",
};

const VERDICT_LABELS: Record<string, string> = {
  approved: "Approved",
  rejected: "Rejected",
  unreviewed: "Unreviewed",
};

interface Props {
  teams: TileRaceRecapTeam[];
}

export function DailySubmissionsChart({ teams }: Props): JSX.Element {
  const rows = buildDailyRows(teams).map((row) => ({
    ...row,
    label: formatRecapDay(row.day),
  }));

  return (
    <RecapCard
      title="Tiles submitted per day"
      description="Every tile submitted that day, by the verdict it ended on."
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No tiles were submitted for this event.
        </p>
      ) : (
        <ChartContainer config={{}} className="h-[240px] w-full">
          <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              content={<RecapTooltip names={VERDICT_LABELS} />}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={8}
              formatter={(value) => VERDICT_LABELS[String(value)] ?? value}
            />
            {Object.keys(VERDICT_COLORS).map((verdict, index, all) => (
              <Bar
                key={verdict}
                dataKey={verdict}
                stackId="verdict"
                fill={VERDICT_COLORS[verdict]}
                radius={index === all.length - 1 ? [3, 3, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ChartContainer>
      )}
    </RecapCard>
  );
}
