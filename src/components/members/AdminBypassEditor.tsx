import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { permissionsApi } from "@/api/permissions";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminBypassEditorProps {
  roles: { id: string; label: string }[];
  bypassRoles: string[];
  onSaved: (roles: string[]) => void;
}

export function AdminBypassEditor({ roles, bypassRoles, onSaved }: AdminBypassEditorProps) {
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<string[]>(bypassRoles);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const isDirty = JSON.stringify([...local].sort()) !== JSON.stringify([...bypassRoles].sort());

  function toggle(roleId: string) {
    setFeedback(null);
    setLocal((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId],
    );
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const data = await permissionsApi.updateAdminBypassRoles(local);
      void queryClient.invalidateQueries({ queryKey: queryKeys.permissions.config() });
      onSaved(data.roles);
      setLocal(data.roles);
      setFeedback({ ok: true, msg: "Saved." });
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-3 bg-muted/30 border-b border-border">
        <span className="flex items-center gap-2 font-medium text-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Admin bypass roles
        </span>
        <div className="flex items-center gap-3 shrink-0">
          {feedback && (
            <span className={cn("text-xs", feedback.ok ? "text-green-600 dark:text-green-400" : "text-destructive")}>
              {feedback.msg}
            </span>
          )}
          <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? "Saving..." : "Save bypass"}
          </Button>
        </div>
      </div>
      <p className="px-4 pt-3 text-xs text-muted-foreground">
        These roles bypass every permission check and can always read and manage all pages.
      </p>
      <div className="flex flex-wrap gap-2 p-4">
        {roles.length === 0 ? (
          <span className="text-sm text-muted-foreground">No roles loaded.</span>
        ) : (
          roles.map(({ id, label }) => {
            const active = local.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/40",
                )}
              >
                {label}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
