import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "./NavLinks";
import { NAV_SECTIONS, MEMBERS_TAB, STAFF_SECTION, getSectionForPath } from "@/lib/navigation";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { highestRoleDisplay } from "@/lib/ranks";
import { cn } from "@/lib/utils";

const ROLE_BADGE_CLASS: Record<string, string> = {
  "Co-owner":         "border-amber-500/60   text-amber-600   dark:text-amber-400",
  "Deputy Owner":     "border-amber-500/60   text-amber-600   dark:text-amber-400",
  "Senior Moderator": "border-red-400/60     text-red-600     dark:text-red-400",
  "Moderator":        "border-orange-400/60  text-orange-600  dark:text-orange-400",
  "Event Team":       "border-green-500/60   text-green-700   dark:text-green-400",
  "Foundry Mentors":  "border-blue-400/60    text-blue-600    dark:text-blue-400",
};

function RoleBadge({ roles, roleLabels }: { roles: string[]; roleLabels: Record<string, string> }) {
  const top = highestRoleDisplay(roles, roleLabels);
  if (!top || !(top in ROLE_BADGE_CLASS)) return null;
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", ROLE_BADGE_CLASS[top])}>
      {top}
    </Badge>
  );
}

const TAB_CLASS = cn(
  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
  "hover:bg-muted hover:text-foreground",
);

const STAFF_PAGE_IDS = [
  "staff.home", "staff.members", "staff.all-tickets",
  "staff.surveys", "staff.badges", "staff.assets", "staff.resources",
] as const;

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const [fetchedAvatarUrl, setFetchedAvatarUrl] = useState<string | null>(null);
  const { pathname } = useLocation();
  const activeTab = getSectionForPath(pathname);
  const navigate = useNavigate();

  const hasStaffAccess = !!user && STAFF_PAGE_IDS.some((id) => hasPermission(id, "read", effectiveRoles));

  useEffect(() => {
    if (!user || user.avatar) { setFetchedAvatarUrl(null); return; }
    const token = getAuthToken();
    if (!token) return;
    let cancelled = false;
    fetch(`${API_URL}/clan/user-avatar/${user.discord_user_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ avatar_url: string }>) : Promise.reject()))
      .then((data) => { if (!cancelled) setFetchedAvatarUrl(data.avatar_url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=32`
    : fetchedAvatarUrl;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="text-sm font-semibold tracking-wide text-primary hover:text-primary/80 transition-colors">
          Iron Foundry
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 md:flex">
          <nav className="flex items-center gap-1">
            {NAV_SECTIONS.map((section) => (
              <button
                key={section.tab}
                onClick={() => navigate({ to: section.links[0].to })}
                className={cn(
                  TAB_CLASS,
                  activeTab === section.tab
                    ? "bg-muted text-primary"
                    : "text-muted-foreground",
                )}
              >
                {section.label}
              </button>
            ))}
            {user && (
              <Link
                to={MEMBERS_TAB.to}
                className={cn(
                  TAB_CLASS,
                  activeTab === MEMBERS_TAB.tab
                    ? "bg-muted text-primary"
                    : "text-muted-foreground",
                )}
              >
                {MEMBERS_TAB.label}
              </Link>
            )}
            {hasStaffAccess && (
              <button
                onClick={() => navigate({ to: STAFF_SECTION.links[0].to })}
                className={cn(
                  TAB_CLASS,
                  activeTab === STAFF_SECTION.tab
                    ? "bg-muted text-primary"
                    : "text-muted-foreground",
                )}
              >
                {STAFF_SECTION.label}
              </button>
            )}
          </nav>

          {user ? (
            <div className="flex items-center gap-2">
              {avatarUrl && (
                <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full" />
              )}
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-sm text-foreground">{user.rsn ?? user.username}</span>
                <RoleBadge roles={user.effective_roles} roleLabels={user.role_labels} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate({ to: "/members/settings" })}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
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
                      className={cn(
                        "flex w-full rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
                        "transition-colors hover:bg-muted hover:text-foreground",
                        "[&.active]:bg-muted [&.active]:text-primary",
                      )}
                    >
                      {MEMBERS_TAB.label}
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
    </header>
  );
}
