import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { NavLinks } from "./NavLinks";
import { LayoutSwitcher } from "./LayoutSwitcher";

interface SideNavProps {
  minimal?: boolean;
}

export function SideNav({ minimal = false }: SideNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-card md:flex">
        {!minimal && (
          <div className="flex h-14 items-center px-4">
            <span className="text-sm font-semibold tracking-wide text-primary">
              Iron Foundry
            </span>
          </div>
        )}
        <Separator />
        <div className="flex flex-1 flex-col gap-4 p-3">
          <NavLinks orientation="vertical" />
        </div>
        <Separator />
        <div className="p-3">
          <LayoutSwitcher />
        </div>
      </aside>

      <div className="fixed bottom-4 left-4 z-50 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="h-10 w-10 rounded-full shadow-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-56 border-border bg-card pt-12"
          >
            <NavLinks
              orientation="vertical"
              onNavigate={() => setMobileOpen(false)}
            />
            <div className="mt-4">
              <LayoutSwitcher />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}