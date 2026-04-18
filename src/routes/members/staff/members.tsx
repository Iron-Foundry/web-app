import { useEffect, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { StaffGuard } from "@/components/StaffGuard";
import { Badge } from "@/components/ui/badge";
import { highestRole } from "@/lib/ranks";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { registerPage } from "@/lib/permissions";

registerPage({
  id: "staff.members",
  label: "Staff — Members",
  description: "View and manage clan member roster.",
  defaults: { read: ["Moderator"], create: ["Senior Moderator"], edit: ["Senior Moderator"], delete: ["Senior Moderator"] },
});

export const staffMembersRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/members",
  component: () => <StaffGuard minRank="Moderator"><StaffMembersPage /></StaffGuard>,
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

type SortKey =
  | "rsn"
  | "discord_username"
  | "clan_rank"
  | "role"
  | "total_loot_value"
  | "collection_log_slots"
  | "join_date"
  | "recruited_by"
  | "key_is_active";

type SortDir = "asc" | "desc";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function fmtGp(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)         return `${Math.round(v / 1_000)}K`;
  return v.toLocaleString();
}

function rowMatchesSearch(m: MemberRow, q: string): boolean {
  return (
    (m.rsn?.toLowerCase().includes(q) ?? false) ||
    m.discord_username.toLowerCase().includes(q) ||
    m.discord_user_id.includes(q) ||
    (m.clan_rank?.toLowerCase().includes(q) ?? false) ||
    (m.recruited_by?.includes(q) ?? false) ||
    (m.discord_roles ?? []).some((r) => r.toLowerCase().includes(q)) ||
    (m.key_is_active ? "active" : "inactive").includes(q) ||
    (m.join_date ? fmtDate(m.join_date) : "").toLowerCase().includes(q) ||
    String(m.total_loot_value).includes(q) ||
    String(m.collection_log_slots).includes(q)
  );
}

function sortMembers(rows: MemberRow[], key: SortKey, dir: SortDir): MemberRow[] {
  return [...rows].sort((a, b) => {
    let av: string | number | boolean | null;
    let bv: string | number | boolean | null;

    switch (key) {
      case "rsn":             av = a.rsn ?? ""; bv = b.rsn ?? ""; break;
      case "discord_username": av = a.discord_username; bv = b.discord_username; break;
      case "clan_rank":       av = a.clan_rank ?? ""; bv = b.clan_rank ?? ""; break;
      case "role":            av = highestRole(a.discord_roles) ?? ""; bv = highestRole(b.discord_roles) ?? ""; break;
      case "total_loot_value": av = a.total_loot_value; bv = b.total_loot_value; break;
      case "collection_log_slots": av = a.collection_log_slots; bv = b.collection_log_slots; break;
      case "join_date":       av = a.join_date ?? a.created_at; bv = b.join_date ?? b.created_at; break;
      case "recruited_by":    av = a.recruited_by ?? ""; bv = b.recruited_by ?? ""; break;
      case "key_is_active":   av = a.key_is_active ? 1 : 0; bv = b.key_is_active ? 1 : 0; break;
    }

    if (av === null || av === undefined) av = "";
    if (bv === null || bv === undefined) bv = "";

    let cmp = 0;
    if (typeof av === "number" && typeof bv === "number") {
      cmp = av - bv;
    } else {
      cmp = String(av).localeCompare(String(bv));
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="inline h-3 w-3 ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp className="inline h-3 w-3 ml-1" />
    : <ChevronDown className="inline h-3 w-3 ml-1" />;
}

interface RsnCellProps {
  memberId: string;
  rsn: string | null;
  onSaved: (id: string, rsn: string | null) => void;
}

function RsnCell({ memberId, rsn, onSaved }: RsnCellProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(rsn ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setValue(rsn ?? "");
    setError(null);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  async function save() {
    const trimmed = value.trim() || null;
    if (trimmed === rsn) { cancel(); return; }
    setSaving(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/staff/members/${memberId}/rsn`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rsn: trimmed }),
      });
      if (res.status === 409) { setError("RSN already linked to another account."); return; }
      if (!res.ok) { setError("Failed to save."); return; }
      const data = (await res.json()) as { rsn: string | null };
      onSaved(memberId, data.rsn);
      setEditing(false);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1 min-w-36">
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") cancel();
            }}
            disabled={saving}
            className="h-7 py-0 px-2 text-xs w-36"
            placeholder="RSN…"
          />
          <button onClick={save} disabled={saving} className="text-xs text-primary hover:underline disabled:opacity-50">Save</button>
          <button onClick={cancel} disabled={saving} className="text-xs text-muted-foreground hover:underline disabled:opacity-50">Cancel</button>
        </div>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div className="group/rsn flex items-center gap-1.5">
      <span className={rsn ? "font-medium text-foreground" : "italic text-muted-foreground"}>
        {rsn ?? "-"}
      </span>
      <button
        onClick={startEdit}
        aria-label="Edit RSN"
        className="opacity-0 group-hover/rsn:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>
  );
}

function StaffMembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("join_date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { setLoading(false); return; }
    fetch(`${API_URL}/staff/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json() as Promise<MemberRow[]>)
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleRsnSaved(id: string, rsn: string | null) {
    setMembers((prev) => prev.map((m) => (m.discord_user_id === id ? { ...m, rsn } : m)));
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const q = search.toLowerCase().trim();
  const filtered = q ? members.filter((m) => rowMatchesSearch(m, q)) : members;
  const sorted = sortMembers(filtered, sortKey, sortDir);

  function Th({ label, col, align }: { label: string; col: SortKey; align?: "right" }) {
    return (
      <th
        className={`px-4 py-2 font-medium cursor-pointer select-none whitespace-nowrap hover:text-foreground${align === "right" ? " text-right" : ""}`}
        onClick={() => handleSort(col)}
      >
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </th>
    );
  }

  return (
    <div className="max-w-6xl space-y-4">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Member List</h1>
        <p className="text-muted-foreground text-sm">{members.length} registered accounts</p>
      </div>

      <Input
        placeholder="Search any field…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members found.</p>
      ) : (
        <div className="rounded-md border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <Th label="RSN"         col="rsn" />
                <Th label="Discord"     col="discord_username" />
                <Th label="Rank"        col="clan_rank" />
                <Th label="Role"        col="role" />
                <Th label="Loot"        col="total_loot_value" align="right" />
                <Th label="Log"         col="collection_log_slots" align="right" />
                <Th label="Joined"      col="join_date" />
                <Th label="Recruited By" col="recruited_by" />
                <Th label="API Key"     col="key_is_active" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((m) => {
                const topRole = highestRole(m.discord_roles ?? []);
                return (
                  <tr key={m.discord_user_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2">
                      <RsnCell memberId={m.discord_user_id} rsn={m.rsn} onSaved={handleRsnSaved} />
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {m.discord_avatar_url && (
                          <img src={m.discord_avatar_url} alt="" className="h-5 w-5 rounded-full object-cover shrink-0" />
                        )}
                        <div>
                          <div>{m.discord_username}</div>
                          <div className="text-xs text-muted-foreground/60">{m.discord_user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{m.clan_rank ?? "-"}</td>
                    <td className="px-4 py-2">
                      {topRole ? <Badge variant="secondary" className="text-xs">{topRole}</Badge> : "-"}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {m.total_loot_value ? fmtGp(m.total_loot_value) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {m.collection_log_slots || "-"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {m.join_date ? fmtDate(m.join_date) : m.created_at ? fmtDate(m.created_at) : "-"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {m.recruited_by ?? "-"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={m.key_is_active ? "text-green-600 dark:text-green-400 text-xs font-medium" : "text-muted-foreground text-xs"}>
                        {m.key_is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
