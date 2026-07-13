import { useState } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { NavLinks } from "./NavLinks";
import { ProfileMenu } from "./ProfileMenu";
import { ControlPanel } from "@/components/members/ControlPanel";
import { hasControlPanelAccess } from "@/components/members/controlPanelPages";
import { NAV_SECTIONS, MEMBERS_TAB, STAFF_SECTION, getSectionForPath } from "@/lib/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { cn } from "@/lib/utils";

const LINK_CLASS = cn(
  "block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
  "transition-colors hover:bg-muted hover:text-foreground",
  "[&.active]:text-primary",
);

const MOBILE_ACCOUNT_LINK = cn(
  "flex w-full rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
  "transition-colors hover:bg-muted hover:text-foreground",
  "[&.active]:bg-muted [&.active]:text-primary",
);

const STAFF_PAGE_IDS = [
  "staff.home", "staff.members", "staff.all-tickets",
  "staff.surveys", "staff.resources",
] as const;

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const { pathname } = useLocation();
  const activeTab = getSectionForPath(pathname);
  const navigate = useNavigate();

  const hasStaffAccess = !!user && STAFF_PAGE_IDS.some((id) => hasPermission(id, "read", effectiveRoles));
  const showControlPanel = !!user && hasControlPanelAccess(hasPermission, effectiveRoles);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="text-sm font-semibold tracking-wide text-primary hover:text-primary/80 transition-colors">
          Iron Foundry
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              {NAV_SECTIONS.map((section) => (
                <NavigationMenuItem key={section.tab}>
                  <NavigationMenuTrigger
                    className={activeTab === section.tab ? "text-primary!" : ""}
                  >
                    {section.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="flex flex-col p-1 min-w-40">
                      {section.links.map((link) => (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            activeOptions={{ exact: "exact" in link ? !!link.exact : false }}
                            className={LINK_CLASS}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}

              {hasStaffAccess && (
                <NavigationMenuItem>
                  <Link
                    to={STAFF_SECTION.links[0].to}
                    className={cn(
                      "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-muted hover:text-foreground",
                      activeTab === STAFF_SECTION.tab
                        ? "bg-muted text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {STAFF_SECTION.label}
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {user ? (
            <ProfileMenu user={user} logout={logout} />
          ) : (
            <Button size="sm" onClick={() => navigate({ to: "/login" })}>
              Login
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 border-border bg-card pt-12 overflow-y-auto">
              <div className="flex flex-col gap-4">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.tab}>
                    <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {section.label}
                    </p>
                    <NavLinks
                      links={section.links}
                      orientation="vertical"
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </div>
                ))}
                {user && (
                  <div>
                    <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                      Account
                    </p>
                    <Link
                      to={MEMBERS_TAB.to}
                      onClick={() => setMobileOpen(false)}
                      className={MOBILE_ACCOUNT_LINK}
                    >
                      {MEMBERS_TAB.label}
                    </Link>
                    {showControlPanel && (
                      <button
                        type="button"
                        onClick={() => { setMobileOpen(false); setControlPanelOpen(true); }}
                        className={cn(MOBILE_ACCOUNT_LINK, "text-left")}
                      >
                        Control Panel
                      </button>
                    )}
                    <Link
                      to="/members/settings"
                      onClick={() => setMobileOpen(false)}
                      className={MOBILE_ACCOUNT_LINK}
                    >
                      Settings
                    </Link>
                  </div>
                )}
                {hasStaffAccess && (
                  <div>
                    <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {STAFF_SECTION.label}
                    </p>
                    <NavLinks
                      links={STAFF_SECTION.links}
                      orientation="vertical"
                      onNavigate={() => setMobileOpen(false)}
                    />
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
                          alt=""
                          className="h-7 w-7 rounded-full"
                        />
                      )}
                      <span className="truncate text-sm text-foreground">{user.rsn ?? user.username}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => { logout(); setMobileOpen(false); }}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => { navigate({ to: "/login" }); setMobileOpen(false); }}
                  >
                    Login
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {showControlPanel && (
        <ControlPanel open={controlPanelOpen} onOpenChange={setControlPanelOpen} />
      )}
    </header>
  );
}
