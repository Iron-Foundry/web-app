import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { FrenzyChartTooltip } from "./FrenzyChartTooltip";
import { FrenzyFilterLine } from "./FrenzyFilterLine";
import { FrenzyRankChart } from "./FrenzyRankChart";
import { useEventHistory } from "@/hooks/useFrenzy";
import { buildTeamColors } from "@/lib/frenzy";
import { TIME_RANGES, buildDailyData, filterByTimeRange, type TimeRange } from "@/lib/frenzyCharts";
import type { FrenzyEventHistoryTeam } from "@/types/frenzy";

type Daily = "gained" | "rate";
const DAILY: { value: Daily; label: string }[] = [
  { value: "gained", label: "Points gained" },
  { value: "rate", label: "Rate comparison" },
];
const AXIS = { tickLine: false, axisLine: false, tick: { fontSize: 11 } } as const;

interface DailyProps {
  teams: FrenzyEventHistoryTeam[];
  data: Record<string, string | number>[];
  colors: Record<string, string>;
  mode: Daily;
}

function DailyChart({ teams, data, colors, mode }: DailyProps): React.ReactElement {
  const yAxis = <YAxis {...AXIS} width={48} tickFormatter={(v: number) => v.toLocaleString()} />;
  return (
    <ChartContainer config={{}} className="h-[220px] w-full">
      {mode === "gained" ? (
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" {...AXIS} />
          {yAxis}
          <Tooltip content={<FrenzyChartTooltip />} />
          {teams.map((t) => <Bar key={t.id} dataKey={t.name} stackId="a" fill={colors[t.name] ?? "#888"} />)}
        </BarChart>
      ) : (
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" {...AXIS} />
          {yAxis}
          <Tooltip content={<FrenzyChartTooltip />} />
          {teams.map((t) => <Line key={t.id} type="monotone" dataKey={t.name} stroke={colors[t.name] ?? "#888"} strokeWidth={2} dot={false} />)}
        </LineChart>
      )}
    </ChartContainer>
  );
}

export function FrenzyEventCharts(): React.ReactElement {
  const { data: history, isLoading } = useEventHistory();
  const [range, setRange] = useState<TimeRange>("all");
  const [daily, setDaily] = useState<Daily>("gained");
  const [hidden, setHidden] = useState<Set<number>>(new Set());

  const allTeams = history?.teams ?? [];
  const colors = buildTeamColors(allTeams.map((t) => t.name));
  const visible = filterByTimeRange(allTeams.filter((t) => !hidden.has(t.id)), range);
  const dailyData = buildDailyData(visible);

  function toggle(id: number): void {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="rounded-xl border bg-card p-5 space-y-4">
      <h2 className="font-rs-bold text-2xl text-primary">Points over time</h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FrenzyFilterLine label="Range" options={TIME_RANGES} value={range} onChange={setRange} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {allTeams.map((t) => (
            <label key={t.id} className={`inline-flex items-center gap-1.5 cursor-pointer ${hidden.has(t.id) ? "text-muted-foreground line-through" : ""}`}>
              <Checkbox checked={!hidden.has(t.id)} onCheckedChange={() => toggle(t.id)} aria-label={`Show ${t.name}`} />
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors[t.name] }} />
              {t.name}
            </label>
          ))}
        </div>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading history...</p>}
      {history && <FrenzyRankChart history={{ teams: visible }} colors={colors} />}
      {dailyData.length > 1 && (
        <>
          <FrenzyFilterLine label="Daily" options={DAILY} value={daily} onChange={setDaily} />
          <DailyChart teams={visible} data={dailyData} colors={colors} mode={daily} />
        </>
      )}
    </section>
  );
}
