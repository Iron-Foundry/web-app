import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";

export const staffContentRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/content",
  component: StaffContentPage,
});

interface DeprecatedEntry {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  deprecated_at: string | null;
  deprecated_by: {
    discord_user_id: number;
    discord_username: string | null;
    rsn: string | null;
    avatar: string | null;
  } | null;
}

function PageTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize">
      {type}
    </span>
  );
}

function StaffContentPage() {
  const { user } = useAuth();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const { hasPermission } = usePermissions();
  const canSeniorMod = hasPermission("resources", "delete", effectiveRoles);

  const [entries, setEntries] = useState<DeprecatedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch(`${API_URL}/content/deprecated-entries`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json() as Promise<DeprecatedEntry[]>)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRestore(e: DeprecatedEntry) {
    setActionError(null);
    const r = await fetch(
      `${API_URL}/content/${e.page_type}/entries/${e.id}/restore`,
      { method: "POST", headers: getAuthHeaders() },
    );
    if (!r.ok) { setActionError("Failed to restore entry."); return; }
    load();
  }

  async function handlePermanentDelete(e: DeprecatedEntry) {
    if (!confirm(`Permanently delete "${e.title}"? This cannot be undone.`)) return;
    setActionError(null);
    const r = await fetch(
      `${API_URL}/content/${e.page_type}/entries/${e.id}/permanent`,
      { method: "DELETE", headers: getAuthHeaders() },
    );
    if (!r.ok) { setActionError("Failed to delete entry."); return; }
    load();
  }

  if (!canSeniorMod) {
    return <p className="text-destructive text-sm">Requires Senior Moderator or higher.</p>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Deprecated Content</h1>
        <p className="text-muted-foreground text-sm">Restore or permanently delete deprecated entries.</p>
      </div>

      {actionError && <p className="text-xs text-destructive">{actionError}</p>}

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && entries.length === 0 && (
        <p className="text-sm text-muted-foreground">No deprecated entries.</p>
      )}

      {!loading && entries.length > 0 && (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Slug</th>
                <th className="px-3 py-2 text-left font-medium">Deprecated at</th>
                <th className="px-3 py-2 text-left font-medium">By</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2"><PageTypeBadge type={e.page_type} /></td>
                  <td className="px-3 py-2 font-medium">{e.title}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{e.slug}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {e.deprecated_at ? new Date(e.deprecated_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-3 py-2">
                    {e.deprecated_by ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        {e.deprecated_by.avatar && (
                          <img src={e.deprecated_by.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                        )}
                        {e.deprecated_by.rsn ?? e.deprecated_by.discord_username ?? "Unknown"}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRestore(e)}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Restore
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePermanentDelete(e)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete permanently
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
