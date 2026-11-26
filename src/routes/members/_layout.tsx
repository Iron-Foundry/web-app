import { useEffect } from "react";
import { createRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { Footer } from "@/components/layout/Footer";
import { useLayout } from "@/context/LayoutContext";
import { LayoutDashboard, Settings, Ticket, ClipboardList, FileText, Lightbulb, Bug, User } from "lucide-react";
import { rootRoute } from "../__root";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export const membersLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/members",
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

const RAIL_LINK = cn(
  "flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground",
  "transition-colors hover:text-foreground motion-reduce:transition-none",
  "[&.active]:border-primary [&.active]:text-foreground",
);

/** The members pages beside the content from md up; under md the page row carries them. */
function MembersRail({ user }: { user: AuthUser }): React.ReactElement {
  return (
    <nav aria-label="Members pages" className="sticky top-6 hidden w-52 shrink-0 self-start md:flex md:flex-col md:gap-0.5">
      <div className="mb-2 flex items-center gap-2.5 border-b border-border px-3 pb-4">
        {user.avatar ? (
          <img
            src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=32`}
            alt={`${user.username} avatar`}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <span className="h-8 w-8 rounded-full bg-muted" />
        )}
        <span className="truncate text-sm font-semibold text-foreground">{user.rsn ?? user.username}</span>
      </div>
      {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => (
        <Link key={to} to={to} activeOptions={{ exact }} className={RAIL_LINK}>
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
      <hr className="my-2 border-border" />
      <Link to="/members/settings" activeOptions={{ exact: false }} className={RAIL_LINK}>
        <Settings className="h-4 w-4 shrink-0" />
        Settings
      </Link>
    </nav>
  );
}

function MembersShell({ user }: { user: AuthUser }) {
  const { setHasSidebar, hasNestedLayout } = useLayout();

  useEffect(() => {
    setHasSidebar(true);
    return () => setHasSidebar(false);
  }, [setHasSidebar]);

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-auto">
      {hasNestedLayout ? (
        <Outlet />
      ) : (
        <>
          <div className="mx-auto flex w-full max-w-7xl flex-1 gap-10 px-4 py-8 md:px-8">
            <MembersRail user={user} />
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>
          </div>
          <Footer />
        </>
      )}
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
