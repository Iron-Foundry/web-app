import { useEffect, useState } from "react";
import { createRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, LayoutDashboard, Settings, Sun, Moon, Ticket, ShieldCheck, Users, Inbox, ClipboardList, FileText, ArrowRightLeft, Lock } from "lucide-react";
import { rootRoute } from "../__root";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { hasMinRank } from "@/lib/ranks";

export const membersLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/members",
  component: MembersLayout,
});

const NAV_LINKS = [
  { to: "/members" as const,              label: "Dashboard",   icon: LayoutDashboard, exact: true },
  { to: "/members/tickets" as const,      label: "Tickets",     icon: Ticket,          exact: false },
  { to: "/members/surveys" as const,      label: "Surveys",     icon: ClipboardList,   exact: false },
  { to: "/members/applications" as const, label: "Applications",icon: FileText,        exact: false },
];

const STAFF_NAV = [
  { to: "/members/staff" as const,             label: "Staff Home",  icon: ShieldCheck,  minRank: "Mentor",    exact: true },
  { to: "/members/staff/members" as const,     label: "Members",     icon: Users,        minRank: "Moderator", exact: false },
  { to: "/members/staff/all-tickets" as const, label: "All Tickets", icon: Inbox,        minRank: "Moderator", exact: false },
  { to: "/members/staff/surveys" as const,       label: "Surveys",       icon: ClipboardList,    minRank: "Mentor",            exact: false },
  { to: "/members/staff/rank-mappings" as const,  label: "Rank Mappings",  icon: ArrowRightLeft, minRank: "Senior Moderator", exact: false },
  { to: "/members/staff/permissions" as const,    label: "Permissions",    icon: Lock,           minRank: "Senior Moderator", exact: false },
];

function navLinkClass(base?: string) {
  return cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
    "transition-colors hover:bg-muted hover:text-foreground",
    "[&.active]:bg-muted [&.active]:text-primary",
    base,
  );
}

function SidebarNav({ onNavigate, effectiveRoles }: { onNavigate?: () => void; effectiveRoles: string[] }) {
  const { theme, toggleTheme } = useTheme();

  const visibleStaff = STAFF_NAV.filter(({ minRank }) => hasMinRank(effectiveRoles, minRank));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Top nav links */}
      <nav className="flex flex-col gap-1 p-2">
        {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact }}
            className={navLinkClass()}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Staff section */}
      {visibleStaff.length > 0 && (
        <div className="px-2 pb-1">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Staff
          </p>
          {visibleStaff.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              activeOptions={{ exact }}
              className={navLinkClass()}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: theme toggle + settings + profile */}
      <div className="flex flex-col gap-1 border-t border-border p-2">
        <button
          onClick={toggleTheme}
          className={navLinkClass("w-full text-left cursor-pointer")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <Link
          to="/members/settings"
          onClick={onNavigate}
          activeOptions={{ exact: false }}
          className={navLinkClass()}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
      </div>
    </div>
  );
}

function MembersLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-1 -m-6">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          {user.avatar && (
            <img
              src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=32`}
              alt=""
              className="h-7 w-7 rounded-full"
            />
          )}
          <span className="truncate text-sm font-medium text-foreground">
            {user.rsn ?? user.username}
          </span>
        </div>
        <SidebarNav effectiveRoles={user.effective_roles} />
      </aside>


      {/* Mobile sidebar trigger */}
      <div className="fixed bottom-4 left-4 z-40 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shadow-md">
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col w-56 border-border bg-card pt-4 gap-0">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              {user.avatar && (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=32`}
                  alt=""
                  className="h-7 w-7 rounded-full"
                />
              )}
              <span className="truncate text-sm font-medium text-foreground">
                {user.rsn ?? user.username}
              </span>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} effectiveRoles={user.effective_roles} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Page content */}
      <div className="flex-1 p-6 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
