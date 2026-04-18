import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Tabs } from "radix-ui";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { cacheInvalidate } from "@/lib/cache";
import { getPageRegistry, registerPage, type PagePermissionConfig } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

// ── Route registration ────────────────────────────────────────────────────────

registerPage({
  id: "staff.permissions",
  label: "Page Permissions",
  description: "Configure who can read, edit, or delete content on each page.",
  defaults: { read: [], create: ["Senior Moderator"], edit: ["Senior Moderator"], delete: ["Senior Moderator"] },
});

export const staffPermissionsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/permissions",
  component: PermissionsPage,
});

// ── Constants ─────────────────────────────────────────────────────────────────

// Fallback if rank-mappings haven't loaded yet
const FALLBACK_ROLES = ["Mentor", "Event Team", "Moderator", "Senior Moderator"];

const ACTIONS = [
  { key: "read",   label: "Read",   hint: "empty = all users" },
  { key: "create", label: "Create", hint: "empty = Senior Mod+" },
  { key: "edit",   label: "Edit",   hint: "empty = Senior Mod+" },
  { key: "delete", label: "Delete", hint: "empty = Senior Mod+" },
] as const;

const TABS = [
  { value: "public",  label: "Public",  prefix: null },
  { value: "members", label: "Members", prefix: "members." },
  { value: "staff",   label: "Staff",   prefix: "staff." },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type PagePermissionsMap = Record<string, PagePermissionConfig>;

// ── Sub-components ────────────────────────────────────────────────────────────

function PageCard({
  page,
  cfg,
  roleOptions,
  onSetAction,
}: {
  page: ReturnType<typeof getPageRegistry>[number];
  cfg: PagePermissionConfig;
  roleOptions: string[];
  onSetAction: (action: keyof PagePermissionConfig, roles: string[]) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{page.label}</span>
          <Badge variant="outline" className="text-xs font-mono">{page.id}</Badge>
        </div>
        {page.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{page.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACTIONS.map(({ key, label, hint }) => (
          <div key={key} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {label}{" "}
              <span className="font-normal text-muted-foreground/60">({hint})</span>
            </p>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={cfg[key]}
              onValueChange={(v) => onSetAction(key, v)}
              className="flex-wrap justify-start"
            >
              {roleOptions.map((role) => (
                <ToggleGroupItem key={role} value={role} className="text-xs h-7 px-2.5">
                  {role}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

function PermissionsPage() {
  const [saved, setSaved] = useState<PagePermissionsMap>({});
  const [local, setLocal] = useState<PagePermissionsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [roleOptions, setRoleOptions] = useState<string[]>(FALLBACK_ROLES);

  const pages = getPageRegistry();

  const token = getAuthToken();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const permissionsReq = fetch(`${API_URL}/config/page-permissions`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ pages: {} })))
      .then((data: { pages: PagePermissionsMap }) => {
        setSaved(data.pages ?? {});
        setLocal(data.pages ?? {});
      })
      .catch(() => {});

    const rankMappingsReq = fetch(`${API_URL}/config/rank-mappings`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ mappings: [] })))
      .then((data: { mappings: { clan_rank: string; discord_role: string }[] }) => {
        const roles = [...new Set((data.mappings ?? []).map((m) => m.discord_role).filter(Boolean))];
        if (roles.length > 0) setRoleOptions(roles);
      })
      .catch(() => {});

    Promise.all([permissionsReq, rankMappingsReq]).finally(() => setLoading(false));
  }, []);

  function getConfig(pageId: string): PagePermissionConfig {
    return (
      local[pageId] ??
      pages.find((p) => p.id === pageId)?.defaults ?? {
        read: [],
        create: [],
        edit: [],
        delete: [],
      }
    );
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
        cacheInvalidate("config:page-permissions");
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

  // Group pages by tab
  function pagesForTab(tab: (typeof TABS)[number]) {
    return pages.filter((p) => {
      if (tab.prefix === null) return !p.id.includes(".");
      return p.id.startsWith(tab.prefix);
    });
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Page Permissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Control which roles can read, create, edit, or delete content on each page.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {feedback && (
            <span className={`text-sm ${feedback.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              {feedback.msg}
            </span>
          )}
          <Button onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <Separator />

      {pages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pages registered yet.</p>
      ) : (
        <Tabs.Root defaultValue="public">
          {/* Tab list */}
          <Tabs.List className="flex border-b border-border gap-1">
            {TABS.map((tab) => {
              const count = pagesForTab(tab).length;
              return (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 text-sm font-medium -mb-px border-b-2 border-transparent",
                    "text-muted-foreground hover:text-foreground transition-colors",
                    "data-[state=active]:text-foreground data-[state=active]:border-primary",
                  )}
                >
                  {tab.label}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-mono leading-none text-muted-foreground">
                    {count}
                  </span>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          {/* Tab content */}
          {TABS.map((tab) => (
            <Tabs.Content key={tab.value} value={tab.value} className="mt-5 space-y-4">
              {pagesForTab(tab).length === 0 ? (
                <p className="text-sm text-muted-foreground">No pages in this group.</p>
              ) : (
                pagesForTab(tab).map((page) => (
                  <PageCard
                    key={page.id}
                    page={page}
                    cfg={getConfig(page.id)}
                    roleOptions={roleOptions}
                    onSetAction={(action, roles) => setAction(page.id, action, roles)}
                  />
                ))
              )}
            </Tabs.Content>
          ))}
        </Tabs.Root>
      )}
    </div>
  );
}
