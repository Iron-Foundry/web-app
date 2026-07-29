import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MUSIC_GROUPS, MUSIC_PAGES } from "./musicPanelPages";
import { cn } from "@/lib/utils";

interface MusicPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPageId?: string | null;
}

/**
 * The music panel, built like the Control Panel: one dialog, a grouped nav down
 * the side, and one page rendered at a time. Every page reads the same live
 * session out of `MusicContext`, so switching pages costs no reconnection.
 */
export function MusicPanel({
  open,
  onOpenChange,
  initialPageId,
}: MusicPanelProps): React.ReactElement {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (open && initialPageId) setSelectedId(initialPageId);
  }, [open, initialPageId]);

  const activeId = MUSIC_PAGES.some((page) => page.id === selectedId)
    ? selectedId
    : MUSIC_PAGES[0].id;
  const active =
    MUSIC_PAGES.find((page) => page.id === activeId) ?? MUSIC_PAGES[0];
  const ActiveComponent = active.Component;

  const renderNav = (onNavigate?: () => void) =>
    MUSIC_GROUPS.map((group) => {
      const pages = MUSIC_PAGES.filter((page) => page.group === group);
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
                id === activeId
                  ? "bg-muted text-primary"
                  : "text-muted-foreground",
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
            <DialogTitle>Music</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex min-h-0 flex-1">
          <nav className="hidden w-56 shrink-0 overflow-y-auto border-r border-border p-2 md:block">
            {renderNav()}
          </nav>
          <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <ActiveComponent key={active.id} />
          </div>
        </div>
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left" className="w-72 gap-0 p-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle>Music</SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto p-2">
              {renderNav(() => setNavOpen(false))}
            </nav>
          </SheetContent>
        </Sheet>
      </DialogContent>
    </Dialog>
  );
}
