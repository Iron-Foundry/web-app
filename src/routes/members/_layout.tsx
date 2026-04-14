import { useEffect, useState } from "react";
import { createRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, LayoutDashboard, Settings, Sun, Moon } from "lucide-react";
import { rootRoute } from "../__root";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const membersLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/members",
  component: MembersLayout,
});

const NAV_LINKS = [
  { to: "/members" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
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
  const { theme, toggleTheme } = useTheme();

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
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col">
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
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
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
