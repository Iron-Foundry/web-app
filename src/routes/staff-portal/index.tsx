import { useEffect, useMemo, useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, ResponsiveContainer, Legend } from "recharts";
import { staffPortalLayoutRoute } from "./_layout";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import { StaffGuard } from "@/components/StaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Users, Ticket, ShieldCheck, BookOpen, Image, Trophy, BookMarked, SlidersHorizontal } from "lucide-react";
import { shineHandlers } from "@/hooks/useShineEffect";
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
  reddit:            "#ff4500",
  osrs_discord:      "#5865f2",
  website:           "#22c55e",
  recruited_by:      "#f59e0b",
  instagram:         "#e1306c",
  other:             "#8b5cf6",
  prefer_not_to_say: "#94a3b8",
  Unanswered:        "#6b7280",
};

const SOURCE_LABELS: Record<string, string> = {
  reddit:            "Reddit",
  osrs_discord:      "OSRS Discord",
  website:           "Website",
  recruited_by:      "Recruited by",
  instagram:         "Instagram",
  other:             "Other",
  prefer_not_to_say: "Prefer not to say",
};

const SOURCE_BADGE: Record<string, string> = {
  reddit:            "bg-[#ff4500]/15 text-[#ff4500]",
  osrs_discord:      "bg-[#5865f2]/15 text-[#5865f2]",
  website:           "bg-[#22c55e]/15 text-[#22c55e]",
  recruited_by:      "bg-[#f59e0b]/15 text-[#f59e0b]",
  instagram:         "bg-[#e1306c]/15 text-[#e1306c]",
  other:             "bg-[#8b5cf6]/15 text-[#8b5cf6]",
  prefer_not_to_say: "bg-slate-400/15 text-slate-400",
};

const HDYFU_FILTERS = ["All", "reddit", "osrs_discord", "website", "recruited_by", "instagram", "other", "prefer_not_to_say", "Unanswered"] as const;
type HdyfuFilter = (typeof HDYFU_FILTERS)[number];

interface ReferralMember {
  discord_user_id: string;
  discord_username: string;
  discord_avatar_url: string | null;
  rsn: string | null;
  referral_source: string | null;
  referral_detail: string | null;
  join_date: string | null;
  created_at: string | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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
  const [memberDetails, setMemberDetails] = useState<ReferralMember[] | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [hdyfuOpen, setHdyfuOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const [hdyfuFilter, setHdyfuFilter] = useState<HdyfuFilter>("All");
  const [hdyfuSearch, setHdyfuSearch] = useState("");
  const [recSearch, setRecSearch] = useState("");

  function loadDetails() {
    if (memberDetails !== null || detailsLoading) return;
    setDetailsLoading(true);
    const token = getAuthToken();
    if (!token) { setDetailsLoading(false); return; }
    fetch(`${API_URL}/staff/referral-details`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? (r.json() as Promise<ReferralMember[]>) : Promise.reject()))
      .then(setMemberDetails)
      .catch(() => setMemberDetails([]))
      .finally(() => setDetailsLoading(false));
  }

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

  const hdyfuRows = useMemo(() => {
    if (!memberDetails) return [];
    const q = hdyfuSearch.toLowerCase().trim();
    return memberDetails.filter((r) => {
      const matchFilter =
        hdyfuFilter === "All" ? true :
        hdyfuFilter === "Unanswered" ? r.referral_source === null :
        r.referral_source === hdyfuFilter;
      const matchSearch = !q || (
        (r.rsn?.toLowerCase().includes(q) ?? false) ||
        r.discord_username.toLowerCase().includes(q) ||
        (r.referral_detail?.toLowerCase().includes(q) ?? false) ||
        (SOURCE_LABELS[r.referral_source ?? ""]?.toLowerCase().includes(q) ?? false)
      );
      return matchFilter && matchSearch;
    });
  }, [memberDetails, hdyfuFilter, hdyfuSearch]);

  const recRows = useMemo(() => {
    if (!memberDetails) return [];
    const q = recSearch.toLowerCase().trim();
    return memberDetails
      .filter((r) => r.referral_source === "recruited_by")
      .filter((r) => !q || (
        (r.rsn?.toLowerCase().includes(q) ?? false) ||
        r.discord_username.toLowerCase().includes(q) ||
        (r.referral_detail?.toLowerCase().includes(q) ?? false)
      ))
      .sort((a, b) => (a.referral_detail ?? "").localeCompare(b.referral_detail ?? ""));
  }, [memberDetails, recSearch]);

  const unansweredCount = memberDetails ? memberDetails.filter((r) => r.referral_source === null).length : 0;

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
          <div className="shine-border rounded-xl h-full" {...shineHandlers}>
          <Card className="h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">How did you find us?</CardTitle>
              <button
                onClick={() => { loadDetails(); setHdyfuOpen(true); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View details →
              </button>
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
          </div>

          <div className="shine-border rounded-xl h-full" {...shineHandlers}>
          <Card className="h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Recruited by</CardTitle>
              <button
                onClick={() => { loadDetails(); setRecOpen(true); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View details →
              </button>
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

      {/* How did you find us? sheet */}
      <Sheet open={hdyfuOpen} onOpenChange={setHdyfuOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle>How did you find us?</SheetTitle>
            <SheetDescription>
              {memberDetails ? `${memberDetails.length} members — ${unansweredCount} unanswered` : "Loading..."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-6 pt-4">
            <div className="flex flex-wrap gap-1.5">
              {HDYFU_FILTERS.map((f) => {
                const count =
                  !memberDetails ? 0 :
                  f === "All" ? memberDetails.length :
                  f === "Unanswered" ? unansweredCount :
                  memberDetails.filter((r) => r.referral_source === f).length;
                return (
                  <button
                    key={f}
                    onClick={() => setHdyfuFilter(f)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors
                      ${hdyfuFilter === f
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                  >
                    {f === "All" ? "All" : f === "Unanswered" ? "Unanswered" : (SOURCE_LABELS[f] ?? f)}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${hdyfuFilter === f ? "bg-primary-foreground/20" : "bg-background"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <Input
              placeholder="Search RSN, username, detail..."
              value={hdyfuSearch}
              onChange={(e) => setHdyfuSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="flex-1 overflow-auto px-6 pb-6 pt-3">
            {detailsLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
            ) : hdyfuRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No entries found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">RSN</th>
                    <th className="pb-2 font-medium">Discord</th>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Detail</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {hdyfuRows.map((r) => {
                    const srcLabel = r.referral_source ? (SOURCE_LABELS[r.referral_source] ?? r.referral_source) : "Unanswered";
                    const badgeCls = r.referral_source ? (SOURCE_BADGE[r.referral_source] ?? "bg-muted text-muted-foreground") : "bg-muted text-muted-foreground";
                    const detail = (r.referral_source === "recruited_by" || r.referral_source === "other") ? r.referral_detail : null;
                    const displayDate = r.join_date ?? r.created_at;
                    return (
                      <tr key={r.discord_user_id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4 font-medium">{r.rsn ?? <span className="text-muted-foreground">-</span>}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {r.discord_avatar_url && <img src={r.discord_avatar_url} alt="" className="h-5 w-5 rounded-full object-cover shrink-0" />}
                            <span className="text-xs">{r.discord_username}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}>{srcLabel}</span>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground text-xs">{detail ?? <span className="opacity-40">-</span>}</td>
                        <td className="py-2 text-muted-foreground text-xs whitespace-nowrap">{displayDate ? fmtDate(displayDate) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Recruited by sheet */}
      <Sheet open={recOpen} onOpenChange={setRecOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle>Recruited by</SheetTitle>
            <SheetDescription>
              {memberDetails
                ? `${memberDetails.filter((r) => r.referral_source === "recruited_by").length} members recruited by a clan member`
                : "Loading..."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 pt-4 pb-3">
            <Input
              placeholder="Search RSN, username or recruiter name..."
              value={recSearch}
              onChange={(e) => setRecSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="flex-1 overflow-auto px-6 pb-6">
            {detailsLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
            ) : recRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No entries found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">RSN</th>
                    <th className="pb-2 font-medium">Discord</th>
                    <th className="pb-2 font-medium">Recruited by</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recRows.map((r) => {
                    const displayDate = r.join_date ?? r.created_at;
                    return (
                      <tr key={r.discord_user_id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4 font-medium">{r.rsn ?? <span className="text-muted-foreground">-</span>}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {r.discord_avatar_url && <img src={r.discord_avatar_url} alt="" className="h-5 w-5 rounded-full object-cover shrink-0" />}
                            <span className="text-xs">{r.discord_username}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#f59e0b]/15 text-[#f59e0b]">
                            {r.referral_detail ?? "Unknown"}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground text-xs whitespace-nowrap">{displayDate ? fmtDate(displayDate) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
