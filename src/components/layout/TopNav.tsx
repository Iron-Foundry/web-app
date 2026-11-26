import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { MobileNav } from "./MobileNav";
import { ProfileMenu } from "./ProfileMenu";
import { hasControlPanelAccess } from "@/components/members/controlPanelPages";
import { NAV_SECTIONS, STAFF_SECTION, getSectionForPath } from "@/lib/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { useControlPanel } from "@/context/ControlPanelContext";
import { cn } from "@/lib/utils";
import logo from "@/assets/LogoTSPSmall-320x320.png";

const MENU_LINK = cn(
  "block rounded-md px-3 py-2 text-sm font-medium text-foreground",
  "transition-colors hover:bg-muted",
  "[&.active]:text-primary",
);
const SECTION_ACTIVE = "text-foreground! border-b-2 border-primary";

const STAFF_PAGE_IDS = [
  "staff.home", "staff.members", "staff.all-tickets",
  "staff.surveys", "staff.resources",
] as const;

export function TopNav() {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const { openPanel } = useControlPanel();
  const { pathname } = useLocation();
  const activeTab = getSectionForPath(pathname);
  const navigate = useNavigate();

  const hasStaffAccess = !!user && STAFF_PAGE_IDS.some((id) => hasPermission(id, "read", effectiveRoles));
  const showControlPanel = !!user && hasControlPanelAccess(hasPermission, effectiveRoles);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src={logo} alt="Iron Foundry logo" className="h-8 w-8" />
          <span className="font-rs-bold text-xl text-mark">Iron Foundry</span>
        </Link>

        <div className="ml-auto hidden items-center gap-6 md:flex">
          <NavigationMenu>
            <NavigationMenuList className="gap-7">
              {NAV_SECTIONS.map((section) => (
                <NavigationMenuItem key={section.tab}>
                  <NavigationMenuTrigger className={activeTab === section.tab ? SECTION_ACTIVE : ""}>
                    {section.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="flex flex-col min-w-44">
                      {section.links.map((link) => (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            activeOptions={{ exact: "exact" in link ? !!link.exact : false }}
                            className={MENU_LINK}
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
                      "inline-flex items-center py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                      activeTab === STAFF_SECTION.tab && SECTION_ACTIVE,
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
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/login" })}>
              Log in
            </Button>
          )}
        </div>

        <MobileNav
          user={user}
          logout={logout}
          hasStaffAccess={hasStaffAccess}
          showControlPanel={showControlPanel}
          openPanel={() => openPanel()}
        />
      </div>
    </header>
  );
}
