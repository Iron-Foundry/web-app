import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { StaffGuard } from "@/components/StaffGuard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CONFIG_PAGES, CONFIG_GROUPS } from "./controlPanelPages";
import { cn } from "@/lib/utils";

interface ControlPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPageId?: string | null;
}

export function ControlPanel({ open, onOpenChange, initialPageId }: ControlPanelProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);

  const visiblePages = useMemo(
    () => CONFIG_PAGES.filter((page) => hasPermission(page.pageId, "read", effectiveRoles)),
    [hasPermission, effectiveRoles],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && initialPageId) setSelectedId(initialPageId);
  }, [open, initialPageId]);

  const activeId = visiblePages.some((page) => page.id === selectedId)
    ? selectedId
    : (visiblePages[0]?.id ?? null);
  const active = visiblePages.find((page) => page.id === activeId) ?? null;
  const ActiveComponent = active?.Component ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[95vh] w-[95vw] max-w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[95vw]">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>Control Panel</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1">
          <nav className="w-56 shrink-0 overflow-y-auto border-r border-border p-2">
            {CONFIG_GROUPS.map((group) => {
              const pages = visiblePages.filter((page) => page.group === group);
              if (pages.length === 0) return null;
              return (
                <div key={group} className="mb-2">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {group}
                  </p>
                  {pages.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedId(id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium",
                        "transition-colors hover:bg-muted hover:text-foreground",
                        id === activeId ? "bg-muted text-primary" : "text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
          <div className="min-w-0 flex-1 overflow-y-auto p-6">
            {active && ActiveComponent ? (
              <StaffGuard key={active.id} pageId={active.pageId} redirectTo={active.redirectTo}>
                <ActiveComponent />
              </StaffGuard>
            ) : (
              <p className="text-sm text-muted-foreground">No configuration pages available.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
