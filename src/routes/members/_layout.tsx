import { useEffect, useState } from "react";
import { createRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, LayoutDashboard, Settings, Ticket, ShieldCheck, Users, Inbox, ClipboardList, FileText, ArrowRightLeft, Lock, Eye, Award, Image } from "lucide-react";
import { rootRoute } from "../__root";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { useViewAs, useEffectiveRoles } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const membersLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/members",
  component: MembersLayout,
});

const NAV_LINKS = [
  { to: "/members" as const,              label: "Dashboard",    icon: LayoutDashboard, exact: true },
  { to: "/members/tickets" as const,      label: "Tickets",      icon: Ticket,          exact: false },
  { to: "/members/surveys" as const,      label: "Surveys",      icon: ClipboardList,   exact: false },
  { to: "/members/applications" as const, label: "Applications", icon: FileText,        exact: false },
];

const STAFF_NAV = [
  { to: "/members/staff" as const,                label: "Staff Home",   icon: ShieldCheck,   pageId: "staff.home",         exact: true },
  { to: "/members/staff/members" as const,        label: "Members",      icon: Users,         pageId: "staff.members",      exact: false },
  { to: "/members/staff/all-tickets" as const,    label: "All Tickets",  icon: Inbox,         pageId: "staff.all-tickets",  exact: false },
  { to: "/members/staff/surveys" as const,        label: "Surveys",      icon: ClipboardList, pageId: "staff.surveys",      exact: false },
  { to: "/members/staff/rank-mappings" as const,  label: "Rank Mappings",icon: ArrowRightLeft,pageId: "staff.rank-mappings",exact: false },
  { to: "/members/staff/permissions" as const,    label: "Permissions",  icon: Lock,          pageId: "staff.permissions",  exact: false },
  { to: "/members/staff/badges" as const,         label: "Badges",       icon: Award,         pageId: "staff.badges",       exact: false },
  { to: "/members/staff/assets" as const,         label: "Asset Library",icon: Image,         pageId: "staff.assets",       exact: false },
];

function navLinkClass(base?: string) {
  return cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
    "transition-colors hover:bg-muted hover:text-foreground",
    "[&.active]:bg-muted [&.active]:text-primary",
    base,
  );
}

const VIEW_AS_FIXED = [
  { value: "self",   label: "Myself" },
  { value: "member", label: "Member (no perms)" },
];

function ViewAsSelector({ realRoles }: { realRoles: string[] }) {
  const { viewAs, setViewAs } = useViewAs();
  const { adminBypassRoles } = usePermissions();
  const { user } = useAuth();

  const isBypassUser = realRoles.some((r) => adminBypassRoles.includes(r));
  if (!isBypassUser) return null;

  // Build dynamic options from role_labels
  const roleLabels = user?.role_labels ?? {};
  const dynamicOptions = Object.entries(roleLabels).map(([id, label]) => ({
    value: id,
    label,
  }));

  const allOptions = [...VIEW_AS_FIXED, ...dynamicOptions];
  const currentLabel = allOptions.find((o) => o.value === viewAs)?.label ?? viewAs;

  return (
    <div className="px-2 pb-2 shrink-0">
      <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
        <Eye className="h-3 w-3" /> View as
      </p>
      <Select value={viewAs} onValueChange={setViewAs}>
        <SelectTrigger className="h-8 text-xs w-full">
          <SelectValue>{currentLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allOptions.map(({ value, label }) => (
            <SelectItem key={value} value={value} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SidebarNav({ onNavigate, realRoles }: { onNavigate?: () => void; realRoles: string[] }) {
  const effectiveRoles = useEffectiveRoles(realRoles);
  const { hasPermission } = usePermissions();

  const visibleStaff = STAFF_NAV.filter(({ pageId }) =>
    hasPermission(pageId, "read", effectiveRoles)
  );

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

      {/* Staff section */}
      {visibleStaff.length > 0 && (
        <div className="px-2 pb-1 shrink-0">
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

      {/* View As selector — bypass roles only */}
      <ViewAsSelector realRoles={realRoles} />

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

function ViewAsBanner() {
  const { viewAs, setViewAs } = useViewAs();
  const { user } = useAuth();
  if (viewAs === "self") return null;
  const label =
    viewAs === "member"
      ? "Member (no perms)"
      : (user?.role_labels?.[viewAs] ?? viewAs);
  return (
    <div className="shrink-0 flex items-center justify-between gap-2 bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-600 dark:text-amber-400">
      <span className="flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" />
        Viewing as <strong>{label}</strong>
      </span>
      <button
        onClick={() => setViewAs("self")}
        className="underline underline-offset-2 hover:no-underline"
      >
        Exit
      </button>
    </div>
  );
}

function MembersShell({ user }: { user: AuthUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-1 min-h-0 -m-6">
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
        <SidebarNav realRoles={user.effective_roles} />
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
            <SidebarNav onNavigate={() => setMobileOpen(false)} realRoles={user.effective_roles} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Page content */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ViewAsBanner />
        <div className="flex-1 min-h-0 p-6 overflow-auto">
          <Outlet />
        </div>
      </div>
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
