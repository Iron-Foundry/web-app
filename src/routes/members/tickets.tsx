import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { registerPage } from "@/lib/permissions";
import { PageHead } from "@/components/layout/PageHead";
import { TicketRow } from "@/components/members/tickets/TicketRow";
import type { TicketSummary } from "@/components/members/tickets/ticketTypes";

registerPage({
  id: "members.tickets",
  label: "Tickets",
  description: "Member support ticket list.",
});

export const membersTicketsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/tickets",
  component: TicketsPage,
});

type TicketsState = { kind: "loading" } | { kind: "failed" } | { kind: "ready"; tickets: TicketSummary[] };

async function fetchTickets(): Promise<TicketSummary[]> {
  const r = await fetch(`${API_URL}/members/me/tickets`, { headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` } });
  if (!r.ok) throw new Error(`tickets answered ${r.status}`);
  return (await r.json()) as TicketSummary[];
}

function TicketsPage() {
  const [state, setState] = useState<TicketsState>({ kind: "loading" });

  useEffect(() => {
    fetchTickets().then(
      (tickets) => setState({ kind: "ready", tickets }),
      () => setState({ kind: "failed" }),
    );
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHead title="Your Tickets" lede="Support and application tickets you've created." />
      {state.kind === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
      {state.kind === "failed" && <p className="text-sm text-destructive">Your tickets could not be loaded. Try again later.</p>}
      {state.kind === "ready" && state.tickets.length === 0 && <p className="text-sm text-muted-foreground">No tickets found.</p>}
      {state.kind === "ready" && state.tickets.length > 0 && (
        <div className="space-y-2.5">
          {state.tickets.map((ticket) => <TicketRow key={ticket.ticket_id} ticket={ticket} />)}
        </div>
      )}
    </div>
  );
}
