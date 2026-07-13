import { useEffect, useState } from "react";
import { createRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { Footer } from "@/components/layout/Footer";
import { useLayout } from "@/context/LayoutContext";
import { Menu, X, LayoutDashboard, Settings, Ticket, ClipboardList, FileText, Lightbulb, Bug, User } from "lucide-react";
import { rootRoute } from "../__root";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ControlPanel } from "@/components/members/ControlPanel";

interface MembersSearch {
  cp?: string;
}

export const membersLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/members",
  validateSearch: (search: Record<string, unknown>): MembersSearch => ({
    cp: typeof search.cp === "string" ? search.cp : undefined,
  }),
  component: MembersLayout,
});

const NAV_LINKS = [
  { to: "/members" as const,              label: "Dashboard",    icon: LayoutDashboard, exact: true  },
  { to: "/members/profile" as const,      label: "Profile",      icon: User,            exact: false },
  { to: "/members/tickets" as const,      label: "Tickets",      icon: Ticket,          exact: false },
  { to: "/members/surveys" as const,      label: "Surveys",      icon: ClipboardList,   exact: false },
  { to: "/members/applications" as const, label: "Applications", icon: FileText,        exact: false },
  { to: "/members/suggestions" as const,  label: "Suggestions",  icon: Lightbulb,       exact: false },
  { to: "/members/bugs" as const,         label: "Bug Reports",  icon: Bug,             exact: false },
];

function navLinkClass(base?: string) {
  return cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
    "transition-colors hover:bg-muted hover:text-foreground",
    "[&.active]:bg-muted [&.active]:text-primary",
    base,
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top nav links */}
      <nav className="flex flex-col gap-1 p-2 shrink-0">
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: settings */}
      <div className="flex flex-col gap-1 border-t border-border p-2 shrink-0">
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

function MembersShell({ user }: { user: AuthUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setHasSidebar, hasNestedLayout } = useLayout();
  const { cp } = membersLayoutRoute.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    setHasSidebar(true);
    return () => setHasSidebar(false);
  }, [setHasSidebar]);

  return (
    <div className="flex flex-1 min-h-0">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 shrink-0">
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
        <SidebarNav />
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
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 shrink-0">
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
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Page content */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 overflow-auto">
          {hasNestedLayout ? (
            <Outlet />
          ) : (
            <>
              <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
                <Outlet />
              </div>
              <Footer />
            </>
          )}
        </div>
      </div>
      <ControlPanel
        open={!!cp}
        initialPageId={cp ?? null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) navigate({ to: "/members", search: {} });
        }}
      />
    </div>
  );
}

function MembersLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return <MembersShell user={user} />;
}
