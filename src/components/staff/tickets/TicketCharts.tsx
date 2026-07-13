import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { shineHandlers } from "@/hooks/useShineEffect";
import { STATUS_COLORS } from "./constants";
import { buildResolutionData, buildTypeData } from "./stats";
import type { TicketSummary } from "./types";

const COUNT_CONFIG: ChartConfig = { count: { label: "Tickets", color: "var(--primary)" } };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="shine-border rounded-xl h-full" {...shineHandlers}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

export function TicketCharts({ tickets }: { tickets: TicketSummary[] }) {
  const statusData = useMemo(() => {
    const open = tickets.filter((t) => t.status === "open").length;
    const closed = tickets.length - open;
    return [
      { name: "Open", status: "open", value: open },
      { name: "Closed", status: "closed", value: closed },
    ].filter((d) => d.value > 0);
  }, [tickets]);

  const typeData = useMemo(() => buildTypeData(tickets), [tickets]);
  const resolutionData = useMemo(() => buildResolutionData(tickets), [tickets]);
  const hasResolution = resolutionData.some((d) => d.count > 0);

  if (!tickets.length) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ChartCard title="By Status">
        <ChartContainer config={COUNT_CONFIG} className="aspect-auto h-56 w-full">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {statusData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] ?? STATUS_COLORS.closed}
                  stroke="var(--background)"
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {statusData.map((d) => (
            <div key={d.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: STATUS_COLORS[d.status] }}
              />
              {d.name} ({d.value})
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="By Type">
        <ChartContainer config={COUNT_CONFIG} className="aspect-auto h-56 w-full">
          <BarChart data={typeData} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="type"
              tick={{ fontSize: 10 }}
              width={104}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      {hasResolution && (
        <ChartCard title="Resolved In">
          <ChartContainer config={COUNT_CONFIG} className="aspect-auto h-56 w-full">
            <BarChart data={resolutionData} margin={{ left: -18, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
      )}
    </div>
  );
}
