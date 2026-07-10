import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMetricHistory } from "@/hooks/useServices";
import type { MetricRecord } from "@/types/services";

const RANGES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
] as const;

const TARGET_COLORS: Record<string, string> = {
  "api.wiseoldman.net": "#6366f1",
  "discord.com": "#22c55e",
  "prices.runescape.wiki": "#f59e0b",
};

const FALLBACK_COLORS = ["#ec4899", "#14b8a6", "#f97316", "#a855f7"];

function targetColor(target: string, index: number): string {
  return TARGET_COLORS[target] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? "#94a3b8";
}

function formatXTick(iso: string, rangeDays: number): string {
  const d = new Date(iso);
  if (rangeDays <= 1) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface TargetEntry {
  count: number;
  errors_4xx: number;
  errors_5xx: number;
  avg_ms: number;
}

function buildChartData(
  records: MetricRecord[],
): { volumeData: Record<string, number | string>[]; errorData: Record<string, number | string>[]; targets: string[] } {
  const targetSet = new Set<string>();
  for (const r of records) {
    const byTarget = r.metrics.by_target as Record<string, TargetEntry> | undefined;
    if (byTarget) Object.keys(byTarget).forEach((t) => targetSet.add(t));
  }
  const targets = Array.from(targetSet);

  const sorted = [...records].reverse();

  const volumeData = sorted.map((r) => {
    const byTarget = r.metrics.by_target as Record<string, TargetEntry> | undefined;
    const row: Record<string, number | string> = { t: r.recorded_at };
    for (const target of targets) {
      row[target] = byTarget?.[target]?.count ?? 0;
    }
    return row;
  });

  const errorData = sorted.map((r) => {
    const byTarget = r.metrics.by_target as Record<string, TargetEntry> | undefined;
    const row: Record<string, number | string> = { t: r.recorded_at };
    for (const target of targets) {
      const entry = byTarget?.[target];
      const total = entry ? entry.count : 0;
      const errors = entry ? entry.errors_4xx + entry.errors_5xx : 0;
      row[target] = total > 0 ? parseFloat(((errors / total) * 100).toFixed(2)) : 0;
    }
    return row;
  });

  return { volumeData, errorData, targets };
}

const CHART_CURSOR = { stroke: "var(--border)", strokeWidth: 1 };

/** Staff portal chart showing outbound call volume and error rates per 3rd party service. */
export function OutboundMetricsChart(): React.ReactElement {
  const [rangeDays, setRangeDays] = useState(7);
  const from = new Date(Date.now() - rangeDays * 86_400_000).toISOString();

  const { data, isPending } = useMetricHistory({
    service: "api-backend",
    module: "outbound_http",
    from,
    range: `${rangeDays}d`,
  });

  const { volumeData, errorData, targets } = useMemo(() => {
    if (!data?.records.length) return { volumeData: [], errorData: [], targets: [] };
    return buildChartData(data.records);
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm">3rd Party Outbound Calls</CardTitle>
          <div className="flex items-center gap-1.5">
            {RANGES.map((r) => (
              <Button
                key={r.label}
                variant={rangeDays === r.days ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setRangeDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isPending ? (
          <div className="space-y-3">
            <div className="h-40 animate-pulse rounded bg-muted" />
            <div className="h-40 animate-pulse rounded bg-muted" />
          </div>
        ) : !data || data.records.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No outbound call data yet. Data appears after the first 5-minute flush interval.
          </p>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Call volume per service</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={volumeData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="t"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => formatXTick(v as string, rangeDays)}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} width={36} />
                  <Tooltip cursor={CHART_CURSOR} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  {targets.map((target, i) => (
                    <Line
                      key={target}
                      type="monotone"
                      dataKey={target}
                      stroke={targetColor(target, i)}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Error rate % per service</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={errorData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="t"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => formatXTick(v as string, rangeDays)}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} width={36} unit="%" />
                  <Tooltip cursor={CHART_CURSOR} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  {targets.map((target, i) => (
                    <Line
                      key={target}
                      type="monotone"
                      dataKey={target}
                      stroke={targetColor(target, i)}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
