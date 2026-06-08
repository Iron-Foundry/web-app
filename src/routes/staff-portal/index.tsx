import { useEffect, useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, ResponsiveContainer, Legend } from "recharts";
import { staffPortalLayoutRoute } from "./_layout";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import { StaffGuard } from "@/components/StaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Ticket, ShieldCheck, BookOpen, Image, Trophy, BookMarked, SlidersHorizontal } from "lucide-react";
import { registerPage } from "@/lib/permissions";

registerPage({
  id: "staff.home",
  label: "Staff Home",
  description: "Staff dashboard and clan statistics.",
  defaults: { read: ["Foundry Mentors"], create: [], edit: [], delete: [] },
});

export const staffPortalIndexRoute = createRoute({
  getParentRoute: () => staffPortalLayoutRoute,
  path: "/",
  component: () => <StaffGuard pageId="staff.home" redirectTo="/staff-portal"><StaffOverviewPage /></StaffGuard>,
});

interface Overview {
  total_members: number;
  open_tickets: number;
  total_tickets: number;
}

interface SourceEntry { source: string | null; label: string; count: number; }
interface RecruiterEntry { name: string; count: number; }
interface ReferralStats { sources: SourceEntry[]; recruiters: RecruiterEntry[]; }

const SOURCE_COLORS: Record<string, string> = {
  reddit:       "#ff4500",
  osrs_discord: "#5865f2",
  website:      "#22c55e",
  recruited_by: "#f59e0b",
  instagram:    "#e1306c",
  other:        "#8b5cf6",
  Unanswered:   "#6b7280",
};

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
  const { user } = useAuth();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const { hasPermission } = usePermissions();
  const canViewMembers       = hasPermission("staff.members",       "read", effectiveRoles);
  const canViewTickets       = hasPermission("staff.all-tickets",   "read", effectiveRoles);
  const canViewContent       = hasPermission("resources",           "delete", effectiveRoles);
  const canViewAssets        = hasPermission("staff.assets",        "read", effectiveRoles);
  const canViewCompetitions  = hasPermission("staff.competitions",  "read", effectiveRoles);
  const canViewResources     = hasPermission("staff.resources",     "read", effectiveRoles);
  const canViewTicketConfig  = hasPermission("staff.ticket-config", "read", effectiveRoles);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(`${API_URL}/staff/overview`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? (r.json() as Promise<Overview>) : Promise.reject()))
      .then(setOverview)
      .catch(() => {});
    fetch(`${API_URL}/staff/referral-stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? (r.json() as Promise<ReferralStats>) : Promise.reject()))
      .then(setReferral)
      .catch(() => {});
  }, []);

  const fmt = (n: number | undefined) =>
    n !== undefined ? n.toLocaleString() : "-";

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Staff Portal</h1>
        <p className="text-muted-foreground text-sm">Internal tools for Iron Foundry staff.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Registered Members" value={fmt(overview?.total_members)} icon={Users} />
        <StatCard label="Open Tickets"       value={fmt(overview?.open_tickets)}   icon={Ticket} />
        <StatCard label="Total Tickets"      value={fmt(overview?.total_tickets)}  icon={ShieldCheck} />
      </div>

      {referral && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">How did you find us?</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={referral.sources.map(s => ({ ...s, key: s.source ?? "Unanswered" }))}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {referral.sources.map((s) => (
                      <Cell
                        key={s.source ?? "null"}
                        fill={SOURCE_COLORS[s.source ?? "Unanswered"] ?? "#6b7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ payload }) => {
                      const item = payload?.[0];
                      if (!item) return null;
                      return (
                        <div className="rounded-md border border-border bg-popover px-3 py-1.5 text-xs shadow">
                          <span className="font-medium">{item.name}</span>: {item.value}
                        </div>
                      );
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recruited by</CardTitle>
            </CardHeader>
            <CardContent>
              {referral.recruiters.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">No recruitment data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={referral.recruiters} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip
                      content={({ payload }) => {
                        const item = payload?.[0];
                        if (!item) return null;
                        return (
                          <div className="rounded-md border border-border bg-popover px-3 py-1.5 text-xs shadow">
                            <span className="font-medium">{item.payload.name}</span>: {item.value} recruited
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {(canViewMembers || canViewTickets || canViewContent || canViewAssets || canViewCompetitions || canViewResources || canViewTicketConfig) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {canViewMembers && (
            <Link
              to="/staff-portal/members"
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
          )}
          {canViewTickets && (
            <Link
              to="/staff-portal/all-tickets"
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
          )}
          {canViewContent && (
            <Link
              to="/members/config/content"
              className="rounded-lg border border-border bg-card p-4 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Content</p>
                  <p className="text-xs text-muted-foreground">Manage deprecated content entries</p>
                </div>
              </div>
            </Link>
          )}
          {canViewAssets && (
            <Link
              to="/staff-portal/assets"
              className="rounded-lg border border-border bg-card p-4 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Image className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Asset Library</p>
                  <p className="text-xs text-muted-foreground">Upload and manage shared assets</p>
                </div>
              </div>
            </Link>
          )}
          {canViewCompetitions && (
            <Link
              to="/members/config/competitions"
              className="rounded-lg border border-border bg-card p-4 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Competitions</p>
                  <p className="text-xs text-muted-foreground">Configure multi-metric competition tracking</p>
                </div>
              </div>
            </Link>
          )}
          {canViewResources && (
            <Link
              to="/staff-portal/resources"
              className="rounded-lg border border-border bg-card p-4 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookMarked className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Staff Resources</p>
                  <p className="text-xs text-muted-foreground">Internal guides and reference material</p>
                </div>
              </div>
            </Link>
          )}
          {canViewTicketConfig && (
            <Link
              to="/members/config/ticket-config"
              className="rounded-lg border border-border bg-card p-4 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Ticket Config</p>
                  <p className="text-xs text-muted-foreground">Configure ticket types, messages and images</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
