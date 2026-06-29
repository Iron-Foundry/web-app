import { createRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LeaderboardProvider } from "@/components/leaderboards/LeaderboardContext";
import { registerPage } from "@/lib/permissions";

registerPage({
  id: "leaderboards",
  label: "Leaderboards",
  description: "Clan skill and activity leaderboards.",
  defaults: { read: [], create: ["Senior Moderator"], edit: ["Senior Moderator"], delete: ["Senior Moderator"] },
});

const TABS = [
  { to: "/leaderboards/pb", label: "Personal Bests" },
  { to: "/leaderboards/clog", label: "Collection Logs" },
  { to: "/leaderboards/kc", label: "Killcounts" },
  { to: "/leaderboards/leagues", label: "Cluescrolls" },
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
      <div className="mx-auto max-w-7xl w-full space-y-4 py-6">
        <h1 className="font-rs-bold text-4xl text-primary">Leaderboards</h1>
        <div className="flex flex-wrap gap-1 justify-start">
          {TABS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ "data-active": "true" } as Record<string, string>}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-transparent px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:border-transparent"
            >
              {label}
            </Link>
          ))}
        </div>
        <Separator />
        <div className="min-h-[60vh]">
          <Outlet />
        </div>
      </div>
    </LeaderboardProvider>
    </TooltipProvider>
  );
}
