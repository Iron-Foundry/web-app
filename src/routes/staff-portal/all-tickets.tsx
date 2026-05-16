import { useEffect, useMemo, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { staffPortalLayoutRoute } from "./_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { StaffGuard } from "@/components/StaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Paperclip, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { registerPage } from "@/lib/permissions";

registerPage({
  id: "staff.all-tickets",
  label: "Staff - All Tickets",
  description: "View all support tickets across all members.",
  defaults: { read: ["Moderator"], create: ["Moderator"], edit: ["Moderator"], delete: ["Senior Moderator"] },
});

export const staffPortalAllTicketsRoute = createRoute({
  getParentRoute: () => staffPortalLayoutRoute,
  path: "/all-tickets",
  component: () => <StaffGuard pageId="staff.all-tickets" redirectTo="/staff-portal"><StaffAllTicketsPage /></StaffGuard>,
});



interface TicketSummary {
  ticket_id: number;
  ticket_type: string;
  status: "open" | "closed" | "archived";
  created_at: string;
  closed_at: string | null;
  close_reason: string | null;
  staff_note: string | null;
  creator: { id: number; display_name: string; avatar_url: string | null };
}

interface Attachment {
  filename: string;
  url: string;
  size?: number;
  content_type?: string | null;
}

interface TranscriptEntry {
  message_id: number;
  author_display_name: string;
  author_avatar_url: string;
  author_is_bot: boolean;
  content: string;
  timestamp: string;
  attachments: Attachment[];
}

interface Transcript {
  ticket_id: number;
  entries: TranscriptEntry[];
  staff_note: string | null;
}

type SortKey = "ticket_id" | "ticket_type" | "creator" | "status" | "created_at" | "closed_at";
type SortDir = "asc" | "desc";



const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp"]);

function isImageAttachment(att: Attachment): boolean {
  if (att.content_type?.startsWith("image/")) return true;
  const ext = att.filename.slice(att.filename.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

function fmtType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit",
  });
}

function avgResolutionTime(tickets: TicketSummary[]): string {
  const closed = tickets.filter((t) => t.status === "closed" && t.closed_at);
  if (!closed.length) return "-";
  const avgMs =
    closed.reduce(
      (sum, t) => sum + (new Date(t.closed_at!).getTime() - new Date(t.created_at).getTime()),
      0,
    ) / closed.length;
  const hours = avgMs / 3_600_000;
  if (hours >= 48) return `${(hours / 24).toFixed(1)}d`;
  return `${hours.toFixed(1)}h`;
}

const STATUS_BADGE: Record<string, string> = {
  open:     "bg-green-500/15 text-green-600 dark:text-green-400",
  closed:   "bg-muted text-muted-foreground",
  archived: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

const STATUS_COLORS: Record<string, string> = {
  open:     "hsl(142 71% 45%)",
  closed:   "hsl(215 16% 47%)",
  archived: "hsl(217 91% 60%)",
};

const TYPE_CHART_CONFIG: ChartConfig = {
  count: { label: "Tickets", color: "var(--primary)" },
};



function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: SortDir } }) {
  if (sort.key !== col) return <ChevronsUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
  return sort.dir === "asc"
    ? <ChevronUp className="ml-1 h-3 w-3" />
    : <ChevronDown className="ml-1 h-3 w-3" />;
}

function TranscriptView({ transcript }: { transcript: Transcript | null }) {
  if (!transcript) {
    return <p className="px-4 py-3 text-sm text-muted-foreground">No transcript available.</p>;
  }
  if (transcript.entries.length === 0) {
    return <p className="px-4 py-3 text-sm text-muted-foreground">Transcript is empty.</p>;
  }
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-border">
      {transcript.staff_note && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-border">
          <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-0.5">Staff note</p>
          <p className="text-sm text-foreground">{transcript.staff_note}</p>
        </div>
      )}
      {transcript.entries.map((entry) => (
        <div
          key={entry.message_id}
          className={cn("flex gap-3 px-4 py-2", entry.author_is_bot && "opacity-60")}
        >
          <img
            src={entry.author_avatar_url}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full mt-0.5"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-foreground">{entry.author_display_name}</span>
              {entry.author_is_bot && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">BOT</Badge>
              )}
              <span className="text-xs text-muted-foreground">{fmtTime(entry.timestamp)}</span>
            </div>
            {entry.content && (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{entry.content}</p>
            )}
            {entry.attachments.map((att) =>
              isImageAttachment(att) ? (
                <a key={att.filename} href={att.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={att.url}
                    alt={att.filename}
                    className="mt-1 max-h-48 max-w-full rounded border border-border object-contain"
                  />
                </a>
              ) : (
                <a
                  key={att.filename}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Paperclip className="h-3 w-3" />
                  {att.filename}
                </a>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}



function StaffAllTicketsPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "ticket_id", dir: "desc" });
  const [selectedTicket, setSelectedTicket] = useState<TicketSummary | null>(null);
  const [transcripts, setTranscripts] = useState<Map<number, Transcript | null>>(new Map());
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSort({ key: "ticket_id", dir: "desc" });
    const token = getAuthToken();
    if (!token) { setLoading(false); return; }
    const params = new URLSearchParams({ limit: "200" });
    if (statusFilter) params.set("status", statusFilter);
    fetch(`${API_URL}/staff/tickets?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json() as Promise<TicketSummary[]>)
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.creator.display_name.toLowerCase().includes(q) ||
        t.ticket_type.toLowerCase().includes(q) ||
        String(t.ticket_id).includes(q),
    );
  }, [tickets, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case "ticket_id":   cmp = a.ticket_id - b.ticket_id; break;
        case "ticket_type": cmp = a.ticket_type.localeCompare(b.ticket_type); break;
        case "creator":     cmp = a.creator.display_name.localeCompare(b.creator.display_name); break;
        case "status":      cmp = a.status.localeCompare(b.status); break;
        case "created_at":  cmp = a.created_at.localeCompare(b.created_at); break;
        case "closed_at":   cmp = (a.closed_at ?? "").localeCompare(b.closed_at ?? ""); break;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort]);

  const stats = useMemo(() => ({
    total:  filtered.length,
    open:   filtered.filter((t) => t.status === "open").length,
    closed: filtered.filter((t) => t.status === "closed").length,
    avgRes: avgResolutionTime(filtered),
  }), [filtered]);

  const statusChartData = useMemo(() => [
    { name: "Open",     status: "open",     value: filtered.filter((t) => t.status === "open").length },
    { name: "Closed",   status: "closed",   value: stats.closed },
    { name: "Archived", status: "archived", value: filtered.filter((t) => t.status === "archived").length },
  ].filter((d) => d.value > 0), [filtered, stats.closed]);

  const typeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of filtered) {
      const label = fmtType(t.ticket_type);
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filtered]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }

  function openSheet(ticket: TicketSummary) {
    setSelectedTicket(ticket);
    if (transcripts.has(ticket.ticket_id)) return;
    setTranscriptLoading(true);
    const token = getAuthToken();
    fetch(`${API_URL}/staff/tickets/${ticket.ticket_id}/transcript`, {
      headers: { Authorization: `Bearer ${token ?? ""}` },
    })
      .then((r) => (r.ok ? (r.json() as Promise<Transcript>) : Promise.resolve(null)))
      .then((data) => setTranscripts((prev) => new Map(prev).set(ticket.ticket_id, data)))
      .catch(() => setTranscripts((prev) => new Map(prev).set(ticket.ticket_id, null)))
      .finally(() => setTranscriptLoading(false));
  }

  const STATUS_OPTIONS = ["", "open", "closed", "archived"] as const;

  const COLUMNS: [SortKey, string][] = [
    ["ticket_id",   "#"],
    ["ticket_type", "Type"],
    ["creator",     "Creator"],
    ["status",      "Status"],
    ["created_at",  "Created"],
    ["closed_at",   "Closed"],
  ];

  const activeTranscript = selectedTicket
    ? (transcripts.get(selectedTicket.ticket_id) ?? null)
    : null;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">All Tickets</h1>
        <p className="text-muted-foreground text-sm">
          {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
          {statusFilter ? ` · ${statusFilter}` : ""}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-rs-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-rs-bold text-green-600 dark:text-green-400">{stats.open}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-rs-bold text-primary">{stats.closed}</p>
            <p className="text-xs text-muted-foreground">Closed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-rs-bold text-primary">{stats.avgRes}</p>
            <p className="text-xs text-muted-foreground">Avg Resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">By Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-40 w-full">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={2}
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? STATUS_COLORS.closed} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ payload }) => {
                      const item = payload?.[0];
                      if (!item) return null;
                      return (
                        <div className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs shadow-md">
                          <span className="text-foreground">{item.name}: <strong>{item.value as number}</strong></span>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ChartContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {statusChartData.map((d) => (
                  <div key={d.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.status] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">By Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={TYPE_CHART_CONFIG} className="h-44 w-full">
                <BarChart
                  data={typeChartData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="type"
                    tick={{ fontSize: 10 }}
                    width={110}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search ticket ID, type or creator…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s || "all"}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets found.</p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map(([key, label]) => (
                  <TableHead key={key}>
                    <button
                      className="flex items-center text-foreground hover:text-foreground/70 transition-colors"
                      onClick={() => toggleSort(key)}
                    >
                      {label}
                      <SortIcon col={key} sort={sort} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((ticket) => (
                <TableRow
                  key={ticket.ticket_id}
                  className="cursor-pointer"
                  onClick={() => openSheet(ticket)}
                >
                  <TableCell>
                    <span className="font-rs-bold text-primary text-xs">
                      #{String(ticket.ticket_id).padStart(4, "0")}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{fmtType(ticket.ticket_type)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ticket.creator.display_name}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs border-0", STATUS_BADGE[ticket.status] ?? STATUS_BADGE.closed)}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(ticket.created_at)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ticket.closed_at ? fmtDate(ticket.closed_at) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Transcript sheet */}
      <Sheet open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}>
        <SheetContent side="right" className="sm:max-w-xl flex flex-col p-0 gap-0">
          {selectedTicket && (
            <>
              <SheetHeader className="p-4 border-b border-border shrink-0">
                <SheetTitle className="flex items-center gap-2 font-rs-bold text-primary">
                  #{String(selectedTicket.ticket_id).padStart(4, "0")}
                  <span className="text-base font-normal text-foreground">
                    {fmtType(selectedTicket.ticket_type)}
                  </span>
                </SheetTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("text-xs border-0", STATUS_BADGE[selectedTicket.status] ?? STATUS_BADGE.closed)}>
                    {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{selectedTicket.creator.display_name}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(selectedTicket.created_at)}</span>
                  {selectedTicket.closed_at && (
                    <>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-xs text-muted-foreground">{fmtDate(selectedTicket.closed_at)}</span>
                    </>
                  )}
                </div>
                {selectedTicket.close_reason && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium text-foreground">Close reason:</span>{" "}
                    {selectedTicket.close_reason}
                  </p>
                )}
              </SheetHeader>
              {transcriptLoading && !transcripts.has(selectedTicket.ticket_id) ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Loading transcript…</p>
              ) : (
                <TranscriptView transcript={activeTranscript} />
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
