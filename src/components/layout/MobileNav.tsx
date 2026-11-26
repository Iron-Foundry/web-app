import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "./NavLinks";
import { NAV_SECTIONS, MEMBERS_TAB, STAFF_SECTION } from "@/lib/navigation";
import type { AuthUser } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const ACCOUNT_LINK = cn(
  "flex w-full rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
  "transition-colors hover:bg-muted hover:text-foreground",
  "[&.active]:bg-muted [&.active]:text-primary",
);
const KICKER = "mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60";

interface Props {
  user: AuthUser | null;
  logout: () => void;
  hasStaffAccess: boolean;
  showControlPanel: boolean;
  openPanel: () => void;
}

/** The menu sheet that carries all sections and account links under md. */
export function MobileNav({ user, logout, hasStaffAccess, showControlPanel, openPanel }: Props): React.ReactElement {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = (): void => setOpen(false);

  return (
    <div className="ml-auto flex items-center md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open navigation">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 border-border bg-card pt-12 overflow-y-auto">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex flex-col gap-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.tab}>
                <p className={KICKER}>{section.label}</p>
                <NavLinks links={section.links} orientation="vertical" onNavigate={close} />
              </div>
            ))}
            {user && (
              <div>
                <p className={KICKER}>Account</p>
                <Link to={MEMBERS_TAB.to} onClick={close} className={ACCOUNT_LINK}>{MEMBERS_TAB.label}</Link>
                {showControlPanel && (
                  <button type="button" onClick={() => { close(); openPanel(); }} className={cn(ACCOUNT_LINK, "text-left")}>
                    Control Panel
                  </button>
                )}
                <Link to="/members/settings" onClick={close} className={ACCOUNT_LINK}>Settings</Link>
              </div>
            )}
            {hasStaffAccess && (
              <div>
                <p className={KICKER}>{STAFF_SECTION.label}</p>
                <NavLinks links={STAFF_SECTION.links} orientation="vertical" onNavigate={close} />
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-border pt-4 px-2">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  {user.avatar && (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=32`}
                      alt={`${user.username} avatar`}
                      className="h-7 w-7 rounded-full"
                    />
                  )}
                  <span className="truncate text-sm text-foreground">{user.rsn ?? user.username}</span>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { logout(); close(); }}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button size="sm" className="w-full" onClick={() => { navigate({ to: "/login" }); close(); }}>
                Login
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
