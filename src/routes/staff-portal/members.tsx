import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { staffPortalLayoutRoute } from "./_layout";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { StaffGuard } from "@/components/StaffGuard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { highestRoleDisplay } from "@/lib/ranks";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { registerPage } from "@/lib/permissions";
import { RsnCell } from "@/components/staff/RsnCell";

registerPage({
  id: "staff.members",
  label: "Staff - Members",
  description: "View and manage clan member roster.",
  defaults: { read: ["Moderator"], create: ["Senior Moderator"], edit: ["Senior Moderator"], delete: ["Senior Moderator"] },
});

export const staffPortalMembersRoute = createRoute({
  getParentRoute: () => staffPortalLayoutRoute,
  path: "/members",
  component: () => <StaffGuard pageId="staff.members" redirectTo="/staff-portal"><StaffMembersPage /></StaffGuard>,
});

interface MemberRow {
  discord_user_id: string;
  discord_username: string;
  discord_avatar_url: string | null;
  rsn: string | null;
  clan_rank: string | null;
  discord_roles: string[];
  stats_opt_out: boolean;
  join_date: string | null;
  created_at: string;
  total_loot_value: number;
  collection_log_slots: number;
  recruited_by: string | null;
  key_is_active: boolean;
}

interface MemberDetail {
  discord_user_id: string;
  discord_username: string;
  discord_avatar_url: string | null;
  rsn: string | null;
  clan_rank: string | null;
  discord_roles: string[];
  stats_opt_out: boolean;
  hide_presence_notifications: boolean;
  join_date: string | null;
  created_at: string;
  updated_at: string;
  total_loot_value: number;
  clan_donated: number;
  collection_log_slots: number;
  collection_log_slots_max: number;
  recruited_by: string | null;
  referral_source: string | null;
  referral_detail: string | null;
  key_is_active: boolean;
  key_created_at: string | null;
  key_expires_at: string | null;
  temp_vc_lock_status: string | null;
  temp_vc_member_limit: number | null;
  temp_vc_bitrate: number | null;
  ticket_count: number;
  badges: {
    badge_id: string;
    name: string;
    description: string;
    icon: string | null;
    color: string;
    text_color: string;
    assigned_at: string | null;
  }[];
  ranking: {
    rank: string;
    points: number;
    boss_points: number;
    skill_points: number;
    updated_at: string;
  } | null;
}

type SortKey = "rsn" | "discord_username" | "clan_rank" | "role";
type SortDir = "asc" | "desc";

const SOURCE_LABELS: Record<string, string> = {
  reddit:            "Reddit",
  osrs_discord:      "OSRS Discord",
  website:           "Website",
  recruited_by:      "Recruited by",
  instagram:         "Instagram",
  other:             "Other",
  prefer_not_to_say: "Prefer not to say",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtGp(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return v.toLocaleString();
}

function rowMatchesSearch(m: MemberRow, q: string, roleLabels: Record<string, string>): boolean {
  return (
    (m.rsn?.toLowerCase().includes(q) ?? false) ||
    m.discord_username.toLowerCase().includes(q) ||
    m.discord_user_id.includes(q) ||
    (m.clan_rank?.toLowerCase().includes(q) ?? false) ||
    (highestRoleDisplay(m.discord_roles ?? [], roleLabels)?.toLowerCase().includes(q) ?? false) ||
    (m.discord_roles ?? []).some((r) => r.toLowerCase().includes(q))
  );
}

function sortRows(rows: MemberRow[], key: SortKey, dir: SortDir, roleLabels: Record<string, string>): MemberRow[] {
  return [...rows].sort((a, b) => {
    let av: string, bv: string;
    if (key === "rsn") { av = a.rsn ?? ""; bv = b.rsn ?? ""; }
    else if (key === "discord_username") { av = a.discord_username; bv = b.discord_username; }
    else if (key === "clan_rank") { av = a.clan_rank ?? ""; bv = b.clan_rank ?? ""; }
    else { av = highestRoleDisplay(a.discord_roles, roleLabels) ?? ""; bv = highestRoleDisplay(b.discord_roles, roleLabels) ?? ""; }
    const cmp = av.localeCompare(bv);
    return dir === "asc" ? cmp : -cmp;
  });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value ?? <span className="text-muted-foreground/50">-</span>}</span>
    </div>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="inline h-3 w-3 ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp className="inline h-3 w-3 ml-1" />
    : <ChevronDown className="inline h-3 w-3 ml-1" />;
}

function MemberDetailSheet({
  memberId,
  open,
  onOpenChange,
  roleLabels,
  onRsnSaved,
}: {
  memberId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roleLabels: Record<string, string>;
  onRsnSaved: (id: string, rsn: string | null) => void;
}) {
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !memberId) return;
    setDetail(null);
    setLoading(true);
    const token = getAuthToken();
    if (!token) { setLoading(false); return; }
    fetch(`${API_URL}/staff/members/${memberId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? (r.json() as Promise<MemberDetail>) : Promise.reject()))
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, memberId]);

  const topRole = detail ? highestRoleDisplay(detail.discord_roles ?? [], roleLabels) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        {loading || !detail ? (
          <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
            {loading ? "Loading..." : "No data."}
          </div>
        ) : (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3 pr-8">
                {detail.discord_avatar_url && (
                  <img src={detail.discord_avatar_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <SheetTitle className="text-base truncate">
                    {detail.rsn ?? detail.discord_username}
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground truncate">{detail.discord_username}</p>
                  <p className="text-xs text-muted-foreground/50">{detail.discord_user_id}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {detail.clan_rank && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                    {detail.clan_rank}
                  </span>
                )}
                {topRole && <Badge variant="secondary" className="text-xs">{topRole}</Badge>}
                {detail.stats_opt_out && (
                  <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs">Stats opt-out</span>
                )}
                {detail.hide_presence_notifications && (
                  <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs">Hide notifications</span>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-auto px-6 py-5 space-y-6">

              {/* RSN edit */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">RSN</p>
                <RsnCell memberId={detail.discord_user_id} rsn={detail.rsn} onSaved={(id, rsn) => {
                  onRsnSaved(id, rsn);
                  setDetail((d) => d ? { ...d, rsn } : d);
                }} />
              </div>

              {/* OSRS stats */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">OSRS Stats</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <DetailRow label="Total Loot" value={detail.total_loot_value ? fmtGp(detail.total_loot_value) : "0"} />
                  <DetailRow label="Clan Donated" value={detail.clan_donated ? fmtGp(detail.clan_donated) : "0"} />
                  <DetailRow label="Collection Log" value={`${detail.collection_log_slots} slots`} />
                  <DetailRow label="Log Peak" value={detail.collection_log_slots_max ? `${detail.collection_log_slots_max} slots` : null} />
                  <DetailRow label="Tickets Opened" value={String(detail.ticket_count)} />
                  <DetailRow label="Joined" value={detail.join_date ? fmtDate(detail.join_date) : (detail.created_at ? fmtDate(detail.created_at) : null)} />
                  <DetailRow label="Account Created" value={fmtDate(detail.created_at)} />
                  <DetailRow label="Last Updated" value={fmtDate(detail.updated_at)} />
                </div>
              </div>

              {/* WOM Ranking */}
              {detail.ranking && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">WOM Ranking</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <DetailRow label="Rank" value={detail.ranking.rank} />
                    <DetailRow label="Total Points" value={detail.ranking.points.toLocaleString()} />
                    <DetailRow label="Boss Points" value={detail.ranking.boss_points.toLocaleString()} />
                    <DetailRow label="Skill Points" value={detail.ranking.skill_points.toLocaleString()} />
                  </div>
                  <p className="text-xs text-muted-foreground/50 mt-2">Updated {fmtDate(detail.ranking.updated_at)}</p>
                </div>
              )}

              {/* Badges */}
              {detail.badges.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Badges</p>
                  <div className="flex flex-wrap gap-2">
                    {detail.badges.map((b) => (
                      <span
                        key={b.badge_id}
                        title={b.description || b.name}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: b.color + "26", color: b.color }}
                      >
                        {b.icon && <span>{b.icon}</span>}
                        {b.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Referral */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Referral</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <DetailRow
                    label="How they found us"
                    value={detail.referral_source ? (SOURCE_LABELS[detail.referral_source] ?? detail.referral_source) : null}
                  />
                  {(detail.referral_source === "recruited_by" || detail.referral_source === "other") && (
                    <DetailRow
                      label={detail.referral_source === "recruited_by" ? "Recruited by" : "Detail"}
                      value={detail.referral_detail}
                    />
                  )}
                </div>
              </div>

              {/* API Key */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">API Key</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <DetailRow
                    label="Status"
                    value={
                      <span className={detail.key_is_active ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}>
                        {detail.key_is_active ? "Active" : "Inactive"}
                      </span>
                    }
                  />
                  <DetailRow label="Created" value={detail.key_created_at ? fmtDate(detail.key_created_at) : null} />
                  <DetailRow label="Expires" value={detail.key_expires_at ? fmtDate(detail.key_expires_at) : null} />
                </div>
              </div>

              {/* Temp VC */}
              {(detail.temp_vc_lock_status || detail.temp_vc_member_limit || detail.temp_vc_bitrate) && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Temp VC Settings</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <DetailRow label="Lock Status" value={detail.temp_vc_lock_status} />
                    <DetailRow label="Member Limit" value={detail.temp_vc_member_limit != null ? String(detail.temp_vc_member_limit) : null} />
                    <DetailRow label="Bitrate" value={detail.temp_vc_bitrate != null ? `${detail.temp_vc_bitrate} kbps` : null} />
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StaffMembersPage() {
  const { user } = useAuth();
  const roleLabels = user?.role_labels ?? {};
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rsn");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { setLoading(false); return; }
    fetch(`${API_URL}/staff/members?limit=1000`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json() as Promise<MemberRow[]>)
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleRsnSaved(id: string, rsn: string | null) {
    setMembers((prev) => prev.map((m) => (m.discord_user_id === id ? { ...m, rsn } : m)));
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function openSheet(id: string) {
    setSelectedId(id);
    setSheetOpen(true);
  }

  const q = search.toLowerCase().trim();
  const filtered = q ? members.filter((m) => rowMatchesSearch(m, q, roleLabels)) : members;
  const sorted = sortRows(filtered, sortKey, sortDir, roleLabels);

  function Th({ label, col }: { label: string; col: SortKey }) {
    return (
      <th
        className="px-4 py-2 font-medium cursor-pointer select-none whitespace-nowrap hover:text-foreground"
        onClick={() => handleSort(col)}
      >
        {label}<SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </th>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Member List</h1>
        <p className="text-muted-foreground text-sm">{members.length} registered accounts</p>
      </div>

      <Input
        placeholder="Search RSN, username, rank, role..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members found.</p>
      ) : (
        <div className="rounded-md border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <Th label="RSN"     col="rsn" />
                <Th label="Discord" col="discord_username" />
                <Th label="Rank"    col="clan_rank" />
                <Th label="Role"    col="role" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((m) => {
                const topRole = highestRoleDisplay(m.discord_roles ?? [], roleLabels);
                return (
                  <tr
                    key={m.discord_user_id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => openSheet(m.discord_user_id)}
                  >
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <RsnCell memberId={m.discord_user_id} rsn={m.rsn} onSaved={handleRsnSaved} />
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {m.discord_avatar_url && (
                          <img src={m.discord_avatar_url} alt="" className="h-5 w-5 rounded-full object-cover shrink-0" />
                        )}
                        <div>
                          <div>{m.discord_username}</div>
                          <div className="text-xs text-muted-foreground/50">{m.discord_user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{m.clan_rank ?? "-"}</td>
                    <td className="px-4 py-2">
                      {topRole ? <Badge variant="secondary" className="text-xs">{topRole}</Badge> : <span className="text-muted-foreground">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <MemberDetailSheet
        memberId={selectedId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        roleLabels={roleLabels}
        onRsnSaved={handleRsnSaved}
      />
    </div>
  );
}
