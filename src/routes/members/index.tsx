import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { useAuth } from "@/context/AuthContext";

export const membersDashboardRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/",
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-rs-bold text-4xl text-primary">
        Welcome, {user.username}!
      </h1>
      {user.rsn && (
        <p className="text-muted-foreground">
          RSN: <span className="text-foreground">{user.rsn}</span>
          {user.clan_rank && (
            <span className="ml-3 text-muted-foreground">
              Rank: <span className="text-foreground">{user.clan_rank}</span>
            </span>
          )}
        </p>
      )}
      <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
        You made it! Tell salt you got here via login 🎉
      </div>
    </div>
  );
}
