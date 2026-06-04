import { useState, useMemo } from "react";
import { createRoute } from "@tanstack/react-router";
import {
  ComposedChart,
  Bar,
  Line,
  LineChart,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TooltipProps } from "recharts";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { staffPortalLayoutRoute } from "./_layout";
import { StaffGuard } from "@/components/StaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { registerPage } from "@/lib/permissions";
import { useServicesStatus, useMetricHistory, useServicesUptime, useBandwidth, useWomRateLimit } from "@/hooks/useServices";
import type { MetricRecord, ServiceStatus, ServiceUptime } from "@/types/services";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

registerPage({
  id: "staff.services",
  label: "Services",
  description: "Live health and metric history for all platform services.",
  defaults: { read: ["Foundry Mentors"], create: [], edit: [], delete: [] },
});

export const staffPortalServicesRoute = createRoute({
  getParentRoute: () => staffPortalLayoutRoute,
  path: "/services",
  component: () => (
    <StaffGuard pageId="staff.services" redirectTo="/staff-portal">
      <ServicesPage />
    </StaffGuard>
  ),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const RANGES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
] as const;

const LINE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6"];

const CHART_CURSOR = { stroke: "var(--border)", strokeWidth: 1 };

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => p.value != null);
  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "8px 12px",
        fontSize: 11,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        minWidth: 160,
      }}
    >
      <p style={{ color: "var(--muted-foreground)", marginBottom: 6, fontSize: 10 }}>
        {label ? new Date(String(label)).toLocaleString() : ""}
      </p>
      {items.map((item) => (
        <div
          key={item.dataKey}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}
        >
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: item.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: item.color, flex: 1 }}>{item.name}</span>
          <span
            style={{
              color: "var(--card-foreground)",
              fontVariantNumeric: "tabular-nums",
              paddingLeft: 12,
            }}
          >
            {(item.value ?? 0).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

function formatUptime(seconds: number | null): string {
  if (!seconds) return "-";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "-";
  return `${ms.toLocaleString()}ms`;
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString();
}

function fmtBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatXTick(iso: string, rangeDays: number): string {
  const d = new Date(iso);
  if (rangeDays <= 1) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ── Uptime history chart ──────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  operational: "bg-green-500",
  incident: "bg-red-500",
  no_data: "bg-muted-foreground/20",
};

function UptimeBar({ service }: { service: ServiceUptime }) {
  const days = service.days;
  const totalDays = days.length;

  return (
    <div className="flex items-center gap-3 min-w-0 py-2">
      <span className="text-xs font-mono text-muted-foreground w-32 shrink-0 truncate">
        {service.service_name}
      </span>

      <TooltipPrimitive.Provider delayDuration={0}>
        <div className="flex gap-px flex-1 h-8 items-stretch min-w-0">
          {days.map((day) => (
            <TooltipPrimitive.Root key={day.date}>
              <TooltipPrimitive.Trigger asChild>
                <div
                  className={cn(
                    "flex-1 rounded-[2px] cursor-default transition-opacity hover:opacity-75",
                    STATUS_COLOR[day.status]
                  )}
                />
              </TooltipPrimitive.Trigger>
              <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                  side="top"
                  sideOffset={6}
                  className="z-50 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                >
                  <p className="font-medium">{new Date(day.date + "T00:00:00").toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</p>
                  <p className={cn(
                    "capitalize",
                    day.status === "operational" && "text-green-500",
                    day.status === "incident" && "text-red-500",
                    day.status === "no_data" && "text-muted-foreground",
                  )}>
                    {day.status === "no_data" ? "No data" : day.status}
                  </p>
                  <TooltipPrimitive.Arrow className="fill-border" />
                </TooltipPrimitive.Content>
              </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
          ))}
        </div>
      </TooltipPrimitive.Provider>

      <div className="text-xs tabular-nums text-muted-foreground w-14 shrink-0 text-right">
        {service.uptime_pct != null ? `${service.uptime_pct}%` : "-"}
      </div>
    </div>
  );
}

function UptimeChart() {
  const { data, isLoading } = useServicesUptime(90);

  const overallHealthy = data
    ? data.every((s) => {
        const last = s.days[s.days.length - 1];
        return last?.status !== "incident";
      })
    : true;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isLoading ? "bg-muted animate-pulse" : overallHealthy ? "bg-green-500" : "bg-red-500"
              )}
            />
            <CardTitle className="text-sm">
              {isLoading
                ? "Checking systems..."
                : overallHealthy
                ? "All systems operational"
                : "Some systems degraded"}
            </CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">Past 90 days</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2 pt-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No uptime data yet.</p>
        ) : (
          <div className="divide-y divide-border/40">
            {data.map((svc) => (
              <UptimeBar key={svc.service_name} service={svc} />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
          <span className="text-[11px] text-muted-foreground">90 days ago</span>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-[2px] bg-green-500" /> Operational</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-[2px] bg-red-500" /> Incident</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-[2px] bg-muted-foreground/20" /> No data</span>
          </div>
          <span className="text-[11px] text-muted-foreground">Today</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Compact service status card ───────────────────────────────────────────────

function MetricValue({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-muted-foreground">-</span>;
  if (typeof value === "boolean")
    return (
      <span className={cn("font-medium", value ? "text-green-500" : "text-red-500")}>
        {value ? "yes" : "no"}
      </span>
    );
  if (typeof value === "number")
    return <span className="font-medium tabular-nums">{value.toLocaleString()}</span>;
  if (typeof value === "object") return null;
  return <span className="font-medium truncate max-w-[180px]">{String(value)}</span>;
}

function ServiceStatusCard({
  svc,
  selected,
  onClick,
}: {
  svc: ServiceStatus;
  selected: boolean;
  onClick: () => void;
}) {
  const scalarMetrics = Object.entries(svc.summary_metrics).filter(
    ([, v]) => typeof v !== "object"
  );

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border bg-card transition-all hover:border-primary/50",
        selected ? "border-primary ring-1 ring-primary" : "border-border",
        !svc.is_healthy && "border-red-500/60 bg-red-950/10"
      )}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {svc.is_healthy ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            )}
            <span className="text-sm font-mono font-medium truncate">{svc.service_name}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {svc.version && (
              <Badge variant="outline" className="text-xs font-mono">
                {svc.version.slice(0, 7)}
              </Badge>
            )}
            {!svc.is_healthy && (
              <Badge variant="destructive" className="text-xs">
                Stale
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(svc.last_seen)}
          </span>
          {svc.uptime_seconds != null && (
            <span>up {formatUptime(svc.uptime_seconds)}</span>
          )}
        </div>

        {scalarMetrics.length > 0 && (
          <dl className="space-y-1">
            {scalarMetrics.slice(0, 4).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between gap-2 text-xs">
                <dt className="text-muted-foreground truncate">{key.replace(/_/g, " ")}</dt>
                <dd>
                  <MetricValue value={val} />
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </button>
  );
}

// ── Endpoint table ────────────────────────────────────────────────────────────

type SortKey = "endpoint" | "count" | "avg_ms" | "p95_ms" | "errors_4xx" | "errors_5xx" | "error_pct" | "avg_req_bytes" | "avg_resp_bytes" | "total_req_bytes" | "total_resp_bytes";
type SortDir = "asc" | "desc";

interface EndpointRow {
  endpoint: string;
  count: number;
  avg_ms: number;
  p95_ms: number;
  errors_4xx: number;
  errors_5xx: number;
  error_pct: number;
  status_codes: Record<string, number>;
  avg_req_bytes: number;
  avg_resp_bytes: number;
  total_req_bytes: number;
  total_resp_bytes: number;
}

const HTTP_STATUS_LABELS: Record<string, string> = {
  "400": "Bad Request",
  "401": "Unauthorized",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "422": "Unprocessable Entity",
  "429": "Too Many Requests",
  "500": "Internal Server Error",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
};

function EndpointErrorSheet({
  row,
  open,
  onOpenChange,
}: {
  row: EndpointRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!row) return null;

  const errorCodes = Object.entries(row.status_codes)
    .filter(([code]) => parseInt(code) >= 400)
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  const codes4xx = errorCodes.filter(([c]) => parseInt(c) < 500);
  const codes5xx = errorCodes.filter(([c]) => parseInt(c) >= 500);
  const totalErrors = errorCodes.reduce((s, [, n]) => s + n, 0);

  function ErrorGroup({
    title,
    codes,
    accent,
  }: {
    title: string;
    codes: [string, number][];
    accent: string;
  }) {
    if (codes.length === 0) return null;
    return (
      <div className="space-y-2">
        <p className={cn("text-xs font-semibold uppercase tracking-wide", accent)}>{title}</p>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Count</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {codes.map(([code, count]) => (
                <tr key={code} className="hover:bg-muted/20">
                  <td className="px-3 py-2.5 font-mono font-semibold">{code}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {HTTP_STATUS_LABELS[code] ?? "Unknown"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                    {count.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {totalErrors > 0 ? `${((count / totalErrors) * 100).toFixed(1)}%` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="font-mono text-sm break-all">{row.endpoint}</SheetTitle>
          <SheetDescription>
            {totalErrors.toLocaleString()} error{totalErrors !== 1 ? "s" : ""} out of{" "}
            {row.count.toLocaleString()} requests ({row.error_pct.toFixed(2)}% error rate)
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 space-y-6">
          <ErrorGroup title="4xx Client Errors" codes={codes4xx} accent="text-yellow-500" />
          <ErrorGroup title="5xx Server Errors" codes={codes5xx} accent="text-red-500" />
          {errorCodes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No error data recorded yet.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? (
    <ChevronUp className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  );
}

function EndpointsTable({ endpoints }: { endpoints: Record<string, Record<string, unknown>> }) {
  const [sortKey, setSortKey] = useState<SortKey>("count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState("");
  const [sheetRow, setSheetRow] = useState<EndpointRow | null>(null);

  const rows = useMemo<EndpointRow[]>(() => {
    return Object.entries(endpoints).map(([endpoint, stats]) => {
      const errors_4xx = (stats.errors_4xx as number) ?? 0;
      const errors_5xx = (stats.errors_5xx as number) ?? 0;
      const count = (stats.count as number) ?? 0;
      return {
        endpoint,
        count,
        avg_ms: (stats.avg_ms as number) ?? 0,
        p95_ms: (stats.p95_ms as number) ?? 0,
        errors_4xx,
        errors_5xx,
        error_pct: count > 0 ? ((errors_4xx + errors_5xx) / count) * 100 : 0,
        status_codes: (stats.status_codes as Record<string, number>) ?? {},
        avg_req_bytes: (stats.avg_req_bytes as number) ?? 0,
        avg_resp_bytes: (stats.avg_resp_bytes as number) ?? 0,
        total_req_bytes: (stats.total_req_bytes as number) ?? 0,
        total_resp_bytes: (stats.total_resp_bytes as number) ?? 0,
      };
    });
  }, [endpoints]);

  const filtered = useMemo(
    () => (filter ? rows.filter((r) => r.endpoint.toLowerCase().includes(filter.toLowerCase())) : rows),
    [rows, filter]
  );

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const Th = ({ label, col }: { label: string; col: SortKey }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap hover:text-foreground"
      onClick={() => toggleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon col={col} sortKey={sortKey} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <>
      <EndpointErrorSheet
        row={sheetRow}
        open={sheetRow !== null}
        onOpenChange={(v) => { if (!v) setSheetRow(null); }}
      />
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Filter endpoints..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <Th label="Endpoint" col="endpoint" />
                <Th label="Requests" col="count" />
                <Th label="Avg (ms)" col="avg_ms" />
                <Th label="P95 (ms)" col="p95_ms" />
                <Th label="Avg req" col="avg_req_bytes" />
                <Th label="Avg resp" col="avg_resp_bytes" />
                <Th label="4xx" col="errors_4xx" />
                <Th label="5xx" col="errors_5xx" />
                <Th label="Error %" col="error_pct" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                    No endpoints match.
                  </td>
                </tr>
              ) : (
                sorted.map((row) => {
                  const hasErrors = row.errors_4xx > 0 || row.errors_5xx > 0;
                  return (
                    <tr
                      key={row.endpoint}
                      className={cn("hover:bg-muted/20 transition-colors", hasErrors && "cursor-pointer")}
                      onClick={hasErrors ? () => setSheetRow(row) : undefined}
                      title={hasErrors ? "Click to view error breakdown" : undefined}
                    >
                      <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">{row.endpoint}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtNum(row.count)}</td>
                      <td className={cn("px-3 py-2 tabular-nums", row.avg_ms > 500 && "text-yellow-500", row.avg_ms > 1000 && "text-red-500")}>
                        {fmtMs(row.avg_ms)}
                      </td>
                      <td className={cn("px-3 py-2 tabular-nums", row.p95_ms > 1000 && "text-yellow-500", row.p95_ms > 2000 && "text-red-500")}>
                        {fmtMs(row.p95_ms)}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{fmtBytes(row.avg_req_bytes)}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{fmtBytes(row.avg_resp_bytes)}</td>
                      <td className={cn("px-3 py-2 tabular-nums", row.errors_4xx > 0 && "text-yellow-500 font-medium underline decoration-dotted")}>
                        {fmtNum(row.errors_4xx)}
                      </td>
                      <td className={cn("px-3 py-2 tabular-nums", row.errors_5xx > 0 && "text-red-500 font-medium underline decoration-dotted")}>
                        {fmtNum(row.errors_5xx)}
                      </td>
                      <td className={cn("px-3 py-2 tabular-nums", row.error_pct > 1 && "text-yellow-500", row.error_pct > 5 && "text-red-500 font-medium")}>
                        {row.error_pct > 0 ? `${row.error_pct.toFixed(1)}%` : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          {sorted.length} endpoint{sorted.length !== 1 ? "s" : ""}
          {sorted.some((r) => r.errors_4xx > 0 || r.errors_5xx > 0) && " — click a row with errors to inspect"}
        </p>
      </div>
    </>
  );
}

// ── Endpoints module view ─────────────────────────────────────────────────────

function StatChip({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-0.5", dim && "opacity-60")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-mono font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function EndpointsView({ records, rangeDays, service }: { records: MetricRecord[]; rangeDays: number; service: string }) {
  const chartData = useMemo(() => {
    return [...records].reverse().map((r) => ({
      t: r.recorded_at,
      requests: (r.metrics.total_requests as number) ?? null,
      latency: (r.metrics.avg_latency_ms as number) ?? null,
      errors_4xx: (r.metrics.total_errors_4xx as number) ?? null,
      errors_5xx: (r.metrics.total_errors_5xx as number) ?? null,
    }));
  }, [records]);

  // Aggregate per-endpoint stats across all records in the selected range
  const aggregatedEndpoints = useMemo(() => {
    const agg: Record<string, {
      count: number; total_ms: number; max_p95: number;
      errors_4xx: number; errors_5xx: number;
      status_codes: Record<string, number>;
      total_req_bytes: number; total_resp_bytes: number;
    }> = {};
    for (const record of records) {
      const endpoints = record.metrics.endpoints as Record<string, Record<string, unknown>> | null;
      if (!endpoints) continue;
      for (const [endpoint, stats] of Object.entries(endpoints)) {
        if (!agg[endpoint]) agg[endpoint] = { count: 0, total_ms: 0, max_p95: 0, errors_4xx: 0, errors_5xx: 0, status_codes: {}, total_req_bytes: 0, total_resp_bytes: 0 };
        const n = (stats.count as number) ?? 0;
        agg[endpoint].count += n;
        agg[endpoint].total_ms += ((stats.avg_ms as number) ?? 0) * n;
        agg[endpoint].max_p95 = Math.max(agg[endpoint].max_p95, (stats.p95_ms as number) ?? 0);
        agg[endpoint].errors_4xx += (stats.errors_4xx as number) ?? 0;
        agg[endpoint].errors_5xx += (stats.errors_5xx as number) ?? 0;
        agg[endpoint].total_req_bytes += (stats.total_req_bytes as number) ?? 0;
        agg[endpoint].total_resp_bytes += (stats.total_resp_bytes as number) ?? 0;
        const sc = stats.status_codes as Record<string, number> | undefined;
        if (sc) {
          for (const [code, cnt] of Object.entries(sc)) {
            agg[endpoint].status_codes[code] = (agg[endpoint].status_codes[code] ?? 0) + cnt;
          }
        }
      }
    }
    return Object.fromEntries(
      Object.entries(agg).map(([endpoint, s]) => [
        endpoint,
        {
          count: s.count,
          avg_ms: s.count > 0 ? Math.round((s.total_ms / s.count) * 10) / 10 : 0,
          p95_ms: s.max_p95,
          errors_4xx: s.errors_4xx,
          errors_5xx: s.errors_5xx,
          status_codes: s.status_codes,
          avg_req_bytes: s.count > 0 ? Math.round(s.total_req_bytes / s.count) : 0,
          avg_resp_bytes: s.count > 0 ? Math.round(s.total_resp_bytes / s.count) : 0,
          total_req_bytes: s.total_req_bytes,
          total_resp_bytes: s.total_resp_bytes,
        },
      ])
    );
  }, [records]);

  const { data: allTimeBw } = useBandwidth(service, "endpoints");

  const totalRequests = chartData.reduce((s, r) => s + (r.requests ?? 0), 0);
  const totalErrors = chartData.reduce((s, r) => s + (r.errors_4xx ?? 0) + (r.errors_5xx ?? 0), 0);
  const avgLatency =
    chartData.length > 0
      ? chartData.reduce((s, r) => s + (r.latency ?? 0), 0) / chartData.filter((r) => r.latency != null).length
      : 0;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  const rangeReqBytes = records.reduce((s, r) => s + ((r.metrics.total_req_bytes as number) ?? 0), 0);
  const rangeRespBytes = records.reduce((s, r) => s + ((r.metrics.total_resp_bytes as number) ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip label="Total requests" value={fmtNum(totalRequests)} />
        <StatChip label="Avg latency" value={fmtMs(Math.round(avgLatency))} />
        <StatChip label="Total errors" value={fmtNum(totalErrors)} dim={totalErrors === 0} />
        <StatChip label="Error rate" value={errorRate > 0 ? `${errorRate.toFixed(2)}%` : "—"} dim={errorRate === 0} />
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2 font-medium">Bandwidth</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip label={`In (${rangeDays}d range)`} value={fmtBytes(rangeReqBytes)} dim={rangeReqBytes === 0} />
          <StatChip label={`Out (${rangeDays}d range)`} value={fmtBytes(rangeRespBytes)} dim={rangeRespBytes === 0} />
          <StatChip label="In (all time)" value={fmtBytes(allTimeBw?.total_req_bytes ?? null)} dim={!allTimeBw?.total_req_bytes} />
          <StatChip label="Out (all time)" value={fmtBytes(allTimeBw?.total_resp_bytes ?? null)} dim={!allTimeBw?.total_resp_bytes} />
        </div>
      </div>

      {chartData.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Request volume & latency</p>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="t"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => formatXTick(v, rangeDays)}
                interval="preserveStartEnd"
              />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} width={40} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={44} unit="ms" />
              <Tooltip content={ChartTooltip} cursor={CHART_CURSOR} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="requests" fill="#6366f1" opacity={0.7} name="requests" radius={[2, 2, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#f59e0b" dot={false} strokeWidth={2} name="avg ms" />
              <Line yAxisId="left" type="monotone" dataKey="errors_5xx" stroke="#ef4444" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="5xx errors" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {Object.keys(aggregatedEndpoints).length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            Per-endpoint breakdown — aggregated over {rangeDays}d
          </p>
          <EndpointsTable endpoints={aggregatedEndpoints} />
        </div>
      )}
    </div>
  );
}

// ── Tickets module view ───────────────────────────────────────────────────────

function fmtDuration(seconds: number | null | undefined): string {
  if (!seconds) return "-";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function TicketsView({ records, rangeDays }: { records: MetricRecord[]; rangeDays: number }) {
  const chartData = useMemo(() => {
    return [...records].reverse().map((r) => ({
      t: r.recorded_at,
      open_count: (r.metrics.open_count as number) ?? null,
      closed_today: (r.metrics.closed_today as number) ?? null,
    }));
  }, [records]);

  const latest = records[0]?.metrics ?? {};
  const avgResolutionSeconds = latest.avg_resolution_seconds_30d as number | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatChip label="Open tickets" value={fmtNum(latest.open_count as number)} />
        <StatChip label="Closed today" value={fmtNum(latest.closed_today as number)} />
        <StatChip label="Avg resolution (30d)" value={fmtDuration(avgResolutionSeconds)} />
      </div>

      {chartData.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Ticket volume over time</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="t"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => formatXTick(v, rangeDays)}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} width={36} allowDecimals={false} />
              <Tooltip content={ChartTooltip} cursor={CHART_CURSOR} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="open_count"
                stroke="#6366f1"
                dot={false}
                strokeWidth={2}
                name="open"
              />
              <Line
                type="monotone"
                dataKey="closed_today"
                stroke="#22c55e"
                dot={false}
                strokeWidth={1.5}
                name="closed today"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Members module view ───────────────────────────────────────────────────────

function MembersView({ records, rangeDays }: { records: MetricRecord[]; rangeDays: number }) {
  const chartData = useMemo(() => {
    const asc = [...records].reverse();
    return asc.map((r, i) => {
      const total = (r.metrics.total_users as number) ?? 0;
      const linked = (r.metrics.users_with_rsn as number) ?? 0;
      const prevTotal = i > 0 ? (((asc[i - 1]?.metrics.total_users) as number) ?? total) : total;
      const prevLinked = i > 0 ? (((asc[i - 1]?.metrics.users_with_rsn) as number) ?? linked) : linked;
      return {
        t: r.recorded_at,
        new_users: Math.max(0, total - prevTotal) || null,
        new_rsn: Math.max(0, linked - prevLinked) || null,
        coverage_pct: total > 0 ? Math.round((linked / total) * 100) : null,
      };
    });
  }, [records]);

  const latest = records[0]?.metrics ?? {};
  const total = (latest.total_users as number) ?? 0;
  const linked = (latest.users_with_rsn as number) ?? 0;
  const coverage = total > 0 ? ((linked / total) * 100).toFixed(1) : "-";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatChip label="Total users" value={fmtNum(total)} />
        <StatChip label="RSN linked" value={fmtNum(linked)} />
        <StatChip label="Coverage" value={coverage !== "-" ? `${coverage}%` : "-"} />
      </div>

      {chartData.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">User growth & RSN coverage</p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="t"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => formatXTick(v, rangeDays)}
                interval="preserveStartEnd"
              />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} width={40} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={36} unit="%" domain={[0, 100]} />
              <Tooltip content={ChartTooltip} cursor={CHART_CURSOR} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="new_users" stackId="growth" fill="#6366f1" opacity={0.85} name="new users" radius={[0, 0, 0, 0]} />
              <Bar yAxisId="left" dataKey="new_rsn" stackId="growth" fill="#22c55e" opacity={0.85} name="new RSN links" radius={[2, 2, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="coverage_pct"
                stroke="#f59e0b"
                dot={false}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                name="coverage %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── CCIngest helpers (used in WebSocketView) ─────────────────────────────────

const CCINGEST_EVENT_COLORS: Record<string, string> = {
  chat: "#6366f1",
  loot: "#f59e0b",
  level_up: "#22c55e",
  pet: "#ec4899",
  xp_milestone: "#14b8a6",
  quest: "#8b5cf6",
  combat_achievement: "#f97316",
  collection_log: "#06b6d4",
  personal_best: "#84cc16",
  new_member: "#10b981",
  coffer_donation: "#eab308",
  coffer_withdrawal: "#ef4444",
  left_clan: "#6b7280",
  expelled: "#dc2626",
  pk: "#b91c1c",
  loot_key: "#d97706",
  clue_item: "#7c3aed",
  hcim_death: "#991b1b",
  diary: "#0ea5e9",
  unknown: "#374151",
};

const CCINGEST_EVENT_LABELS: Record<string, string> = {
  chat: "Chat",
  loot: "Loot",
  level_up: "Level Up",
  pet: "Pet",
  xp_milestone: "XP Milestone",
  quest: "Quest",
  combat_achievement: "Combat Achievement",
  collection_log: "Collection Log",
  personal_best: "Personal Best",
  new_member: "New Member",
  coffer_donation: "Coffer Donation",
  coffer_withdrawal: "Coffer Withdrawal",
  left_clan: "Left Clan",
  expelled: "Expelled",
  pk: "PK",
  loot_key: "Loot Key",
  clue_item: "Clue Item",
  hcim_death: "HCIM Death",
  diary: "Diary",
  duplicate_skipped: "Duplicates",
  unknown: "Unknown",
};

const CCINGEST_CHART_KEYS = [
  "chat", "loot", "level_up", "pet", "xp_milestone", "quest",
  "combat_achievement", "collection_log", "personal_best",
];

// ── Generic module view ───────────────────────────────────────────────────────

function GenericModuleView({ records, rangeDays }: { records: MetricRecord[]; rangeDays: number }) {
  const chartData = useMemo(() => {
    const reversed = [...records].reverse();
    const allKeys = Array.from(
      new Set(
        reversed.flatMap((r) =>
          Object.keys(r.metrics).filter((k) => typeof r.metrics[k] === "number")
        )
      )
    );
    return {
      rows: reversed.map((r) => ({
        t: r.recorded_at,
        ...Object.fromEntries(allKeys.map((k) => [k, r.metrics[k] ?? null])),
      })),
      keys: allKeys,
    };
  }, [records]);

  if (chartData.rows.length === 0)
    return <p className="text-sm text-muted-foreground text-center py-8">No data for this range.</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData.rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="t"
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => formatXTick(v, rangeDays)}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 10 }} width={40} />
        <Tooltip content={ChartTooltip} cursor={CHART_CURSOR} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {chartData.keys.slice(0, 6).map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            dot={false}
            strokeWidth={1.5}
            name={key.replace(/_/g, " ")}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── WebSocket module view ─────────────────────────────────────────────────────

function WebSocketView({ records, rangeDays }: { records: MetricRecord[]; rangeDays: number }) {
  const chartData = useMemo(() => {
    return [...records].reverse().map((r) => ({
      t: r.recorded_at,
      connected_clients: (r.metrics.connected_clients as number) ?? null,
      active_guilds: (r.metrics.active_guilds as number) ?? null,
      messages_dispatched: (r.metrics.messages_dispatched as number) ?? null,
    }));
  }, [records]);

  const combinedChartData = useMemo(() => {
    return [...records].reverse().map((r) => {
      const cc = (r.metrics.ccingest as Record<string, number> | undefined) ?? {};
      const entry: Record<string, unknown> = {
        t: r.recorded_at,
        messages_dispatched: (r.metrics.messages_dispatched as number) ?? null,
      };
      for (const key of CCINGEST_CHART_KEYS) entry[key] = cc[key] ?? 0;
      const tracked = CCINGEST_CHART_KEYS.reduce((s, k) => s + (cc[k] ?? 0), 0);
      const total = cc.total_messages ?? 0;
      entry.other = Math.max(0, total - tracked);
      return entry;
    });
  }, [records]);

  const ingestTotals = useMemo(() => {
    const agg: Record<string, number> = {};
    for (const r of records) {
      const cc = (r.metrics.ccingest as Record<string, number> | undefined) ?? {};
      for (const [k, v] of Object.entries(cc)) {
        if (k !== "total_messages") agg[k] = (agg[k] ?? 0) + v;
      }
    }
    return Object.entries(agg).sort(([, a], [, b]) => b - a);
  }, [records]);

  const totalIngestMessages = ingestTotals
    .filter(([k]) => k !== "duplicate_skipped")
    .reduce((s, [, v]) => s + v, 0);

  const latest = records[0]?.metrics ?? {};
  const totalDispatched = chartData.reduce((s, r) => s + (r.messages_dispatched ?? 0), 0);
  const peakClients = Math.max(...chartData.map((r) => r.connected_clients ?? 0));
  const coveredMinutes = chartData.filter((r) => (r.connected_clients ?? 0) > 0).length;
  const coveragePct = chartData.length > 0 ? ((coveredMinutes / chartData.length) * 100).toFixed(1) : "-";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip label="Connected now" value={fmtNum(latest.connected_clients as number)} />
        <StatChip label="Active guilds" value={fmtNum(latest.active_guilds as number)} />
        <StatChip label="Peak clients" value={fmtNum(peakClients || null)} />
        <StatChip label={`Coverage (${rangeDays}d)`} value={coveragePct !== "-" ? `${coveragePct}%` : "-"} />
      </div>

      {chartData.length > 0 && (
        <>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Connected clients — {rangeDays === 1 ? "1-minute" : "sampled"} resolution
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="clientGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => formatXTick(v, rangeDays)}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} width={32} allowDecimals={false} />
                <Tooltip content={ChartTooltip} cursor={CHART_CURSOR} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="connected_clients"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#clientGradient)"
                  dot={false}
                  name="connected clients"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="active_guilds"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  fill="none"
                  dot={false}
                  name="active guilds"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </>
      )}

      <div className="border-t border-border/60 pt-4 space-y-4">
        <p className="text-xs text-muted-foreground font-medium">
          Clan chat — ingest events &amp; dispatched messages
        </p>

        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={combinedChartData} margin={{ top: 4, right: 44, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="t"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => formatXTick(v, rangeDays)}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} width={36} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={40} allowDecimals={false} />
            <Tooltip content={ChartTooltip} cursor={CHART_CURSOR} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            {CCINGEST_CHART_KEYS.map((key) => (
              <Area
                key={key}
                yAxisId="left"
                type="monotone"
                dataKey={key}
                stackId="ingest"
                stroke={CCINGEST_EVENT_COLORS[key] ?? "#6b7280"}
                fill={CCINGEST_EVENT_COLORS[key] ?? "#6b7280"}
                fillOpacity={0.6}
                dot={false}
                strokeWidth={1}
                name={CCINGEST_EVENT_LABELS[key] ?? key}
                connectNulls={false}
              />
            ))}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="other"
              stackId="ingest"
              stroke="#374151"
              fill="#374151"
              fillOpacity={0.4}
              dot={false}
              strokeWidth={1}
              name="Other"
              connectNulls={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="messages_dispatched"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Dispatched"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            Event breakdown — totals over {rangeDays}d
          </p>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Event type</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Count</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ingestTotals.length === 0
                  ? Object.entries(CCINGEST_EVENT_LABELS).map(([key, label]) => (
                      <tr key={key} className="opacity-40">
                        <td className="px-3 py-2 flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ background: CCINGEST_EVENT_COLORS[key] ?? "#6b7280" }}
                          />
                          {label}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">—</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">—</td>
                      </tr>
                    ))
                  : ingestTotals.map(([key, count]) => (
                      <tr key={key} className="hover:bg-muted/20">
                        <td className="px-3 py-2 flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ background: CCINGEST_EVENT_COLORS[key] ?? "#6b7280" }}
                          />
                          {CCINGEST_EVENT_LABELS[key] ?? key.replace(/_/g, " ")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">
                          {count.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {totalIngestMessages > 0 ? `${((count / totalIngestMessages) * 100).toFixed(1)}%` : "-"}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Service detail panel ──────────────────────────────────────────────────────

const DEFAULT_MODULE: Record<string, string> = {
  "api-backend": "endpoints",
  "discord-server": "bot",
};

function ServiceDetailPanel({ svc }: { svc: ServiceStatus }) {
  const defaultMod = DEFAULT_MODULE[svc.service_name] ?? "endpoints";
  const [selectedModule, setSelectedModule] = useState(defaultMod);
  const [rangeDays, setRangeDays] = useState(7);

  const from = new Date(Date.now() - rangeDays * 86400_000).toISOString();
  const { data, isLoading } = useMetricHistory({
    service: svc.service_name,
    module: selectedModule,
    from,
    range: `${rangeDays}d`,
  });

  const modules = data?.modules ?? [];
  const activeModule = modules.includes(selectedModule) ? selectedModule : (modules[0] ?? selectedModule);

  return (
    <Card className="mt-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-mono">{svc.service_name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {svc.uptime_seconds != null ? `up ${formatUptime(svc.uptime_seconds)} · ` : ""}
              last seen {timeAgo(svc.last_seen)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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

        {modules.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {modules.map((mod) => (
              <Button
                key={mod}
                variant={activeModule === mod ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-xs px-2 font-mono"
                onClick={() => setSelectedModule(mod)}
              >
                {mod}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
            </div>
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : !data || data.records.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No data for <span className="font-mono">{activeModule}</span> in the last {rangeDays}d.
          </p>
        ) : activeModule === "endpoints" ? (
          <EndpointsView records={data.records} rangeDays={rangeDays} service={svc.service_name} />
        ) : activeModule === "websocket" ? (
          <WebSocketView records={data.records} rangeDays={rangeDays} />
        ) : activeModule === "tickets" ? (
          <TicketsView records={data.records} rangeDays={rangeDays} />
        ) : activeModule === "members" ? (
          <MembersView records={data.records} rangeDays={rangeDays} />
        ) : (
          <GenericModuleView records={data.records} rangeDays={rangeDays} />
        )}
      </CardContent>
    </Card>
  );
}

// ── WOM rate limit chart ──────────────────────────────────────────────────────

function WomRateLimitChart() {
  const { data, isLoading } = useWomRateLimit();

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((s) => ({
      t: new Date(s.ts * 1000).toISOString(),
      high: s.remaining,
      normal: Math.max(0, s.remaining - 5),
      low: Math.max(0, s.remaining - 25),
      utilized: 100 - s.remaining,
      queueHigh: s.queueHigh,
      queueNormal: s.queueNormal,
      queueLow: s.queueLow,
    }));
  }, [data]);

  const latest = data?.[data.length - 1];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">WOM Rate Limit</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {latest && (
              <>
                <span>
                  <span className="text-red-400 font-mono font-medium">{latest.remaining}</span>
                  <span className="ml-1 mr-3">high</span>
                  <span className="text-indigo-400 font-mono font-medium">{Math.max(0, latest.remaining - 5)}</span>
                  <span className="ml-1 mr-3">normal</span>
                  <span className="text-slate-400 font-mono font-medium">{Math.max(0, latest.remaining - 25)}</span>
                  <span className="ml-1">low</span>
                </span>
              </>
            )}
            <span className="opacity-60">30-min window · refreshes 15s</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-44 animate-pulse rounded bg-muted" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No data yet - queue starts recording on first WOM request.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Effective budget per priority tier</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="t"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} width={32} domain={[0, 100]} />
                  <Tooltip content={ChartTooltip} cursor={CHART_CURSOR} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="utilized" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 2" dot={false} name="utilized %" />
                  <Line type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={2} dot={false} name="high (0–100)" />
                  <Line type="monotone" dataKey="normal" stroke="#6366f1" strokeWidth={2} dot={false} name="normal (0–95)" />
                  <Line type="monotone" dataKey="low" stroke="#94a3b8" strokeWidth={2} dot={false} name="low (0–75)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {chartData.some((d) => d.queueHigh > 0 || d.queueNormal > 0 || d.queueLow > 0) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Queue depth by priority</p>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="t"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10 }} width={24} allowDecimals={false} />
                    <Tooltip content={ChartTooltip} cursor={CHART_CURSOR} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="queueHigh" stackId="q" stroke="#ef4444" fill="#ef4444" fillOpacity={0.7} dot={false} strokeWidth={1} name="high" />
                    <Area type="monotone" dataKey="queueNormal" stackId="q" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} dot={false} strokeWidth={1} name="normal" />
                    <Area type="monotone" dataKey="queueLow" stackId="q" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.5} dot={false} strokeWidth={1} name="low" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ServicesPage() {
  const { data: services, isLoading, dataUpdatedAt, refetch, isFetching } = useServicesStatus();
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const selectedService = services?.find((s) => s.service_name === selectedName) ?? null;

  function handleCardClick(name: string) {
    setSelectedName((prev) => (prev === name ? null : name));
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-rs-bold text-4xl text-primary">Service Overview</h1>
          <p className="text-muted-foreground text-sm">
            Live health and metrics for all platform services. Auto-refreshes every 30s.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {timeAgo(new Date(dataUpdatedAt).toISOString())}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <UptimeChart />

      <WomRateLimitChart />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : !services || services.length === 0 ? (
        <p className="text-muted-foreground text-sm">No services reporting yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((svc) => (
              <ServiceStatusCard
                key={svc.service_name}
                svc={svc}
                selected={svc.service_name === selectedName}
                onClick={() => handleCardClick(svc.service_name)}
              />
            ))}
          </div>

          {selectedService && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs h-7 text-muted-foreground"
                  onClick={() => setSelectedName(null)}
                >
                  <ArrowLeft className="h-3 w-3" />
                  Close
                </Button>
              </div>
              <ServiceDetailPanel svc={selectedService} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
