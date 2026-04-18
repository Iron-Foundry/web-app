import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { getPageRegistry, registerPage, type PagePermissionConfig } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// ── Route registration ────────────────────────────────────────────────────────

registerPage({
  id: "staff.permissions",
  label: "Page Permissions",
  description: "Configure who can read, edit, or delete content on each page.",
  defaults: { read: [], edit: ["Senior Moderator"], delete: ["Senior Moderator"] },
});

export const staffPermissionsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/permissions",
  component: PermissionsPage,
});

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = ["Mentor", "Event Team", "Moderator", "Senior Moderator"];

// ── Types ─────────────────────────────────────────────────────────────────────

type PagePermissionsMap = Record<string, PagePermissionConfig>;

// ── Component ─────────────────────────────────────────────────────────────────

function PermissionsPage() {
  const [saved, setSaved] = useState<PagePermissionsMap>({});
  const [local, setLocal] = useState<PagePermissionsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const pages = getPageRegistry();

  const token = getAuthToken();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetch(`${API_URL}/config/page-permissions`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ pages: {} })))
      .then((data: { pages: PagePermissionsMap }) => {
        setSaved(data.pages ?? {});
        setLocal(data.pages ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function getConfig(pageId: string): PagePermissionConfig {
    return local[pageId] ?? pages.find((p) => p.id === pageId)?.defaults ?? { read: [], edit: [], delete: [] };
  }

  function setAction(pageId: string, action: keyof PagePermissionConfig, roles: string[]) {
    setLocal((prev) => ({
      ...prev,
      [pageId]: { ...getConfig(pageId), [action]: roles },
    }));
    setFeedback(null);
  }

  const isDirty = JSON.stringify(local) !== JSON.stringify(saved);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const r = await fetch(`${API_URL}/config/page-permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ pages: local }),
      });
      if (r.ok) {
        const data = (await r.json()) as { pages: PagePermissionsMap };
        setSaved(data.pages);
        setLocal(data.pages);
        setFeedback({ ok: true, msg: "Saved." });
      } else {
        setFeedback({ ok: false, msg: `Error ${r.status}` });
      }
    } catch {
      setFeedback({ ok: false, msg: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Page Permissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure read / edit / delete access per page. Empty = no restriction (read) or Senior Mod+ only (edit/delete).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {feedback && (
            <span className={`text-sm ${feedback.ok ? "text-green-600" : "text-destructive"}`}>
              {feedback.msg}
            </span>
          )}
          <Button onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <Separator />

      {pages.length === 0 && (
        <p className="text-sm text-muted-foreground">No pages registered yet.</p>
      )}

      <div className="space-y-6">
        {pages.map((page) => {
          const cfg = getConfig(page.id);
          return (
            <div key={page.id} className="rounded-lg border border-border p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{page.label}</span>
                  <Badge variant="outline" className="text-xs font-mono">{page.id}</Badge>
                </div>
                {page.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{page.description}</p>
                )}
              </div>

              {(["read", "edit", "delete"] as const).map((action) => (
                <div key={action} className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {action === "read" ? "Read (empty = all authenticated)" : action === "edit" ? "Edit (empty = Senior Mod+ only)" : "Delete (empty = Senior Mod+ only)"}
                  </p>
                  <ToggleGroup
                    type="multiple"
                    variant="outline"
                    value={cfg[action]}
                    onValueChange={(v) => setAction(page.id, action, v)}
                    className="flex-wrap justify-start"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <ToggleGroupItem key={role} value={role} className="text-xs h-7 px-2.5">
                        {role}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
