import { useEffect, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { highestRole } from "@/lib/ranks";
import { Input } from "@/components/ui/input";

export const staffMembersRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/members",
  component: StaffMembersPage,
});

interface MemberRow {
  discord_user_id: number;
  discord_username: string;
  rsn: string | null;
  clan_rank: string | null;
  discord_roles: string[];
  stats_opt_out: boolean;
  join_date: string | null;
  created_at: string;
  total_loot_value: number;
  collection_log_slots: number;
}

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

interface RsnCellProps {
  memberId: number;
  rsn: string | null;
  onSaved: (id: number, rsn: string | null) => void;
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
      if (res.status === 409) {
        setError("RSN already linked to another account.");
        return;
      }
      if (!res.ok) {
        setError("Failed to save.");
        return;
      }
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
          <button
            onClick={save}
            disabled={saving}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={cancel}
            disabled={saving}
            className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
          >
            Cancel
          </button>
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

  function handleRsnSaved(id: number, rsn: string | null) {
    setMembers((prev) =>
      prev.map((m) => (m.discord_user_id === id ? { ...m, rsn } : m))
    );
  }

  const q = search.toLowerCase();
  const filtered = q
    ? members.filter(
        (m) =>
          m.rsn?.toLowerCase().includes(q) ||
          m.discord_username.toLowerCase().includes(q) ||
          m.clan_rank?.toLowerCase().includes(q),
      )
    : members;

  return (
    <div className="max-w-5xl space-y-4">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Member List</h1>
        <p className="text-muted-foreground text-sm">
          {members.length} registered accounts
        </p>
      </div>

      <Input
        placeholder="Search RSN, username or rank…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members found.</p>
      ) : (
        <div className="rounded-md border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">RSN</th>
                <th className="px-4 py-2 font-medium">Discord</th>
                <th className="px-4 py-2 font-medium">Rank</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium text-right">Loot</th>
                <th className="px-4 py-2 font-medium text-right">Log</th>
                <th className="px-4 py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => {
                const topRole = highestRole(m.discord_roles ?? []);
                return (
                  <tr key={m.discord_user_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2">
                      <RsnCell
                        memberId={m.discord_user_id}
                        rsn={m.rsn}
                        onSaved={handleRsnSaved}
                      />
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{m.discord_username}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.clan_rank ?? "-"}</td>
                    <td className="px-4 py-2">
                      {topRole ? (
                        <Badge variant="secondary" className="text-xs">{topRole}</Badge>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {m.total_loot_value ? fmtGp(m.total_loot_value) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {m.collection_log_slots ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {m.join_date ? fmtDate(m.join_date) : m.created_at ? fmtDate(m.created_at) : "-"}
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
