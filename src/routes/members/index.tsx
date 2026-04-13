import { useEffect } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { useAuth } from "@/context/AuthContext";

export const membersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/members",
  component: MembersPage,
});

function MembersPage() {
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
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl py-10">
      <h1 className="font-rs-bold text-4xl text-primary">
        Welcome, {user.username}!
      </h1>
      {user.rsn && (
        <p className="mt-2 text-muted-foreground">
          RSN: <span className="text-foreground">{user.rsn}</span>
          {user.clan_rank && (
            <span className="ml-3 text-muted-foreground">
              Rank: <span className="text-foreground">{user.clan_rank}</span>
            </span>
          )}
        </p>
      )}
    </div>
  );
}
