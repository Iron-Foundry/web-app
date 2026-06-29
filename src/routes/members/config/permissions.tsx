import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { StaffGuard } from "@/components/StaffGuard";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getPageRegistry, registerPage, type PagePermissionConfig } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Check, Globe } from "lucide-react";
import { DISCORD_ROLE_ORDER } from "@/lib/ranks";

registerPage({
  id: "staff.permissions",
  label: "Page Permissions",
  description: "Configure who can read, edit, or delete content on each page.",
  defaults: { read: [], create: ["Senior Moderator"], edit: ["Senior Moderator"], delete: ["Senior Moderator"] },
});

export const staffPermissionsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/config/permissions",
  component: () => <StaffGuard pageId="staff.permissions"><PermissionsPage /></StaffGuard>,
});

const ACTIONS = [
  { key: "read",   label: "Read"   },
  { key: "create", label: "Create" },
  { key: "edit",   label: "Edit"   },
  { key: "delete", label: "Delete" },
] as const;

type PagePermissionsMap = Record<string, PagePermissionConfig>;

function RolePermissionCard({
  roleId,
  roleLabel,
  isAdminBypass,
  pages,
  local,
  onToggle,
}: {
  roleId: string;
  roleLabel: string;
  isAdminBypass: boolean;
  pages: ReturnType<typeof getPageRegistry>;
  local: PagePermissionsMap;
  onToggle: (roleId: string, pageId: string, action: keyof PagePermissionConfig, hasAccess: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 bg-muted/30 border-b border-border">
        <span className="font-medium text-sm">{roleLabel}</span>
        {isAdminBypass && <Badge className="text-xs">Admin bypass</Badge>}
      </div>
      {isAdminBypass ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">
          Full access to all pages - bypasses individual settings.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground bg-muted/10 border-b border-border">
              <th className="px-4 py-2 text-left font-medium">Page</th>
              {ACTIONS.map(({ key, label }) => (
                <th key={key} className="px-3 py-2 text-center font-medium w-20">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pages.map((page) => {
              const cfg: PagePermissionConfig = local[page.id] ?? page.defaults ?? { read: [], create: [], edit: [], delete: [] };
              const readOpen = cfg.read.length === 0;
              return (
                <tr key={page.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="text-sm">{page.label}</span>
                    {page.description && (
                      <span className="block text-xs text-muted-foreground/60">{page.description}</span>
                    )}
                  </td>
                  {ACTIONS.map(({ key }) => {
                    const isOpen = key === "read" && readOpen;
                    const hasAccess = isOpen || cfg[key].includes(roleId);
                    return (
                      <td key={key} className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          disabled={isOpen}
                          title={isOpen ? "Open to all authenticated users" : hasAccess ? "Click to revoke" : "Click to grant"}
                          onClick={() => !isOpen && onToggle(roleId, page.id, key, hasAccess)}
                          className={cn(
                            "inline-flex items-center justify-center h-7 w-7 rounded border mx-auto transition-colors",
                            isOpen
                              ? "cursor-default border-transparent text-muted-foreground/40"
                              : hasAccess
                                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                                : "border-border bg-transparent text-muted-foreground/50 hover:border-primary/40 hover:bg-muted/40 cursor-pointer",
                          )}
                        >
                          {isOpen
                            ? <Globe className="h-3.5 w-3.5" />
                            : hasAccess
                              ? <Check className="h-3.5 w-3.5" />
                              : <span className="text-xs leading-none select-none">-</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PermissionsPage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState<PagePermissionsMap>({});
  const [local, setLocal] = useState<PagePermissionsMap>({});
  const [adminBypassRoles, setAdminBypassRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [roleOptions, setRoleOptions] = useState<{ id: string; label: string }[]>([]);

  const pages = getPageRegistry();
  const authHeaders = getAuthHeaders();

  useEffect(() => {
    const permissionsReq = fetch(`${API_URL}/config/page-permissions`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ pages: {}, admin_bypass_roles: [] })))
      .then((data: { pages: PagePermissionsMap; admin_bypass_roles?: string[] }) => {
        setSaved(data.pages ?? {});
        setLocal(data.pages ?? {});
        setAdminBypassRoles(data.admin_bypass_roles ?? []);
      })
      .catch(() => {});

    const rankMappingsReq = fetch(`${API_URL}/config/rank-mappings`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ mappings: [] })))
      .then((data: { mappings: { label: string; discord_role_id: string }[] }) => {
        const seen = new Set<string>();
        const opts = (data.mappings ?? [])
          .filter((m) => m.discord_role_id && m.label)
          .reduce<{ id: string; label: string }[]>((acc, m) => {
            if (!seen.has(m.discord_role_id)) {
              seen.add(m.discord_role_id);
              acc.push({ id: m.discord_role_id, label: m.label });
            }
            return acc;
          }, []);
        if (opts.length > 0) setRoleOptions(opts);
      })
      .catch(() => {});

    Promise.all([permissionsReq, rankMappingsReq]).finally(() => setLoading(false));
  }, []);

  function toggleRoleAction(
    roleId: string,
    pageId: string,
    action: keyof PagePermissionConfig,
    hasAccess: boolean,
  ) {
    setLocal((prev) => {
      const cfg: PagePermissionConfig = prev[pageId] ?? pages.find((p) => p.id === pageId)?.defaults
        ?? { read: [], create: [], edit: [], delete: [] };
      const roles = hasAccess
        ? cfg[action].filter((r) => r !== roleId)
        : [...cfg[action], roleId];
      return { ...prev, [pageId]: { ...cfg, [action]: roles } };
    });
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
        void queryClient.invalidateQueries({ queryKey: queryKeys.permissions.config() });
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
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const sortedRoles = [...roleOptions].sort((a, b) => {
    const ai = (DISCORD_ROLE_ORDER as readonly string[]).indexOf(a.label);
    const bi = (DISCORD_ROLE_ORDER as readonly string[]).indexOf(b.label);
    return (bi === -1 ? -999 : bi) - (ai === -1 ? -999 : ai);
  });

  return (
    <div className="mx-auto max-w-3xl w-full space-y-5 py-6">
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
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      <Separator />

      {sortedRoles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No roles loaded.</p>
      ) : (
        <div className="space-y-4">
          {sortedRoles.map(({ id, label }) => (
            <RolePermissionCard
              key={id}
              roleId={id}
              roleLabel={label}
              isAdminBypass={adminBypassRoles.includes(id)}
              pages={pages}
              local={local}
              onToggle={toggleRoleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
