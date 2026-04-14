import { useEffect, useState } from "react";
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
                    <td className="px-4 py-2 font-medium text-foreground">
                      {m.rsn ?? <span className="text-muted-foreground italic">-</span>}
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
                      {m.created_at ? fmtDate(m.created_at) : "-"}
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
