import { createRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { PageHead } from "@/components/layout/PageHead";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LeaderboardProvider } from "@/components/leaderboards/LeaderboardContext";
import { registerPage } from "@/lib/permissions";

registerPage({
  id: "leaderboards",
  label: "Leaderboards",
  description: "Clan skill and activity leaderboards.",
});

const TABS = [
  { to: "/leaderboards/pb", label: "Personal Bests" },
  { to: "/leaderboards/clog", label: "Collection Logs" },
  { to: "/leaderboards/kc", label: "Killcounts" },
  { to: "/leaderboards/cluescrolls", label: "Cluescrolls" },
  { to: "/leaderboards/ranking", label: "Ranking" },
] as const;

export const leaderboardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboards",
  beforeLoad: ({ location }) => {
    if (location.pathname === "/leaderboards" || location.pathname === "/leaderboards/") {
      throw redirect({ to: "/leaderboards/pb" });
    }
  },
  component: LeaderboardsLayout,
});

function LeaderboardsLayout(): React.ReactElement {
  return (
    <TooltipProvider delayDuration={200}>
    <LeaderboardProvider>
      <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
        <PageHead title="Leaderboards" />
        <nav aria-label="Leaderboard" className="flex gap-7 overflow-x-auto border-b border-border">
          {TABS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="-mb-px shrink-0 whitespace-nowrap border-b-2 border-transparent pb-3 text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:border-primary [&.active]:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="min-h-[60vh]">
          <Outlet />
        </div>
      </div>
    </LeaderboardProvider>
    </TooltipProvider>
  );
}
