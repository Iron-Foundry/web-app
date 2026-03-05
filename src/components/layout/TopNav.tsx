import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLinks } from "./NavLinks";
import { LayoutSwitcher } from "./LayoutSwitcher";

interface TopNavProps {
  showTitle?: boolean;
}

export function TopNav({ showTitle = true }: TopNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {showTitle && (
          <span className="text-sm font-semibold tracking-wide text-primary">
            Iron Foundry
          </span>
        )}

        <div className="hidden items-center gap-4 md:flex">
          <NavLinks orientation="horizontal" />
          <LayoutSwitcher />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LayoutSwitcher />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {mobileOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-56 border-border bg-card pt-12"
            >
              <NavLinks
                orientation="vertical"
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}