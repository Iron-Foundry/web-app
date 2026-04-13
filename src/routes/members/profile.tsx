import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export const membersProfileRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "profile",
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-rs-bold text-3xl text-primary">Profile</h1>

      <div className="rounded-md border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img
              src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=64`}
              alt=""
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-muted" />
          )}
          <div>
            <p className="text-lg font-semibold text-foreground">{user.username}</p>
            <p className="text-sm text-muted-foreground">Discord account</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">RSN</span>
            <span className="text-foreground">{user.rsn ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Clan rank</span>
            <span className="text-foreground">{user.clan_rank ?? "—"}</span>
          </div>
        </div>

        <Button disabled className="w-full">
          Edit profile (coming soon)
        </Button>
      </div>
    </div>
  );
}
