import { useEffect, useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Ticket, ShieldCheck } from "lucide-react";

export const staffIndexRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff",
  component: StaffOverviewPage,
});

interface Overview {
  total_members: number;
  open_tickets: number;
  total_tickets: number;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <Icon className="h-8 w-8 shrink-0 text-primary opacity-80" />
        <div>
          <p className="text-2xl font-rs-bold text-primary">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StaffOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(`${API_URL}/staff/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json() as Promise<Overview>)
      .then(setOverview)
      .catch(() => {});
  }, []);

  const fmt = (n: number | undefined) =>
    n !== undefined ? n.toLocaleString() : "—";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Staff Portal</h1>
        <p className="text-muted-foreground text-sm">Internal tools for Iron Foundry staff.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Registered Members" value={fmt(overview?.total_members)} icon={Users} />
        <StatCard label="Open Tickets"       value={fmt(overview?.open_tickets)}   icon={Ticket} />
        <StatCard label="Total Tickets"      value={fmt(overview?.total_tickets)}  icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to="/members/staff/members"
          className="rounded-lg border border-border bg-card p-4 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Member List</p>
              <p className="text-xs text-muted-foreground">View all registered accounts</p>
            </div>
          </div>
        </Link>
        <Link
          to="/members/staff/all-tickets"
          className="rounded-lg border border-border bg-card p-4 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <Ticket className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">All Tickets</p>
              <p className="text-xs text-muted-foreground">Browse and view all support tickets</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
