import { useEffect, useMemo, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { staffPortalLayoutRoute } from "./_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { StaffGuard } from "@/components/StaffGuard";
import { registerPage } from "@/lib/permissions";
import { StatCards } from "@/components/staff/tickets/StatCards";
import { TicketCharts } from "@/components/staff/tickets/TicketCharts";
import { StaffLeaderboard } from "@/components/staff/tickets/StaffLeaderboard";
import { TicketFilters } from "@/components/staff/tickets/TicketFilters";
import { TicketTable } from "@/components/staff/tickets/TicketTable";
import { TicketDetailSheet } from "@/components/staff/tickets/TicketDetailSheet";
import type {
  SortDir, SortKey, TicketSummary, Transcript,
} from "@/components/staff/tickets/types";

registerPage({
  id: "staff.all-tickets",
  label: "Staff - All Tickets",
  description: "View all support tickets across all members.",
});

export const staffPortalAllTicketsRoute = createRoute({
  getParentRoute: () => staffPortalLayoutRoute,
  path: "/all-tickets",
  component: () => (
    <StaffGuard pageId="staff.all-tickets" redirectTo="/staff-portal">
      <StaffAllTicketsPage />
    </StaffGuard>
  ),
});

function StaffAllTicketsPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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
    let result = tickets;
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          t.creator.display_name.toLowerCase().includes(q) ||
          (t.creator.rsn?.toLowerCase().includes(q) ?? false) ||
          t.ticket_type.toLowerCase().includes(q) ||
          String(t.ticket_id).includes(q),
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter((t) => new Date(t.created_at).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86_400_000 - 1;
      result = result.filter((t) => new Date(t.created_at).getTime() <= to);
    }
    return result;
  }, [tickets, search, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case "ticket_id": cmp = a.ticket_id - b.ticket_id; break;
        case "ticket_type": cmp = a.ticket_type.localeCompare(b.ticket_type); break;
        case "creator": cmp = a.creator.display_name.localeCompare(b.creator.display_name); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "created_at": cmp = a.created_at.localeCompare(b.created_at); break;
        case "closed_at": cmp = (a.closed_at ?? "").localeCompare(b.closed_at ?? ""); break;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort]);

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

  const activeTranscript = selectedTicket
    ? (transcripts.get(selectedTicket.ticket_id) ?? null)
    : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">All Tickets</h1>
        <p className="text-muted-foreground text-sm">
          {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
          {statusFilter ? ` · ${statusFilter}` : ""}
        </p>
      </div>

      <StatCards tickets={filtered} />

      {!loading && filtered.length > 0 && (
        <>
          <TicketCharts tickets={filtered} />
          <StaffLeaderboard tickets={filtered} onOpenTicket={openSheet} />
        </>
      )}

      <TicketFilters
        search={search}
        onSearch={setSearch}
        dateFrom={dateFrom}
        onDateFrom={setDateFrom}
        dateTo={dateTo}
        onDateTo={setDateTo}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets found.</p>
      ) : (
        <TicketTable tickets={sorted} sort={sort} onToggleSort={toggleSort} onOpen={openSheet} />
      )}

      <TicketDetailSheet
        ticket={selectedTicket}
        transcript={activeTranscript}
        transcriptLoading={transcriptLoading}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
