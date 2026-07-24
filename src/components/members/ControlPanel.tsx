import { useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { StaffGuard } from "@/components/StaffGuard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (open && initialPageId) setSelectedId(initialPageId);
  }, [open, initialPageId]);

  const activeId = visiblePages.some((page) => page.id === selectedId)
    ? selectedId
    : (visiblePages[0]?.id ?? null);
  const active = visiblePages.find((page) => page.id === activeId) ?? null;
  const ActiveComponent = active?.Component ?? null;

  const renderNav = (onNavigate?: () => void) =>
    CONFIG_GROUPS.map((group) => {
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
              onClick={() => {
                setSelectedId(id);
                onNavigate?.();
              }}
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
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[95vh] w-[95vw] max-w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[95vw]">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              className="-ml-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <DialogTitle>Control Panel</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex min-h-0 flex-1">
          <nav className="hidden w-56 shrink-0 overflow-y-auto border-r border-border p-2 md:block">
            {renderNav()}
          </nav>
          <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {active && ActiveComponent ? (
              <StaffGuard key={active.id} pageId={active.pageId} redirectTo={active.redirectTo}>
                <ActiveComponent />
              </StaffGuard>
            ) : (
              <p className="text-sm text-muted-foreground">No configuration pages available.</p>
            )}
          </div>
        </div>
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left" className="w-72 gap-0 p-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle>Control Panel</SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto p-2">{renderNav(() => setNavOpen(false))}</nav>
          </SheetContent>
        </Sheet>
      </DialogContent>
    </Dialog>
  );
}
