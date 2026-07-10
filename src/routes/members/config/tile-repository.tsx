import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { registerPage } from "@/lib/permissions";
import { StaffGuard } from "@/components/StaffGuard";
import { RepositoryList } from "@/components/tilerace/repository/RepositoryList";

registerPage({
  id: "staff.tile-repository",
  label: "Tile Repository",
  description: "Manage shared tiles for tile race events.",
  defaults: {
    read: ["Foundry Mentors"],
    create: ["Foundry Mentors"],
    edit: ["Foundry Mentors"],
    delete: ["Foundry Mentors"],
  },
});

export const tileRepositoryRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/config/tile-repository",
  component: () => (
    <StaffGuard pageId="staff.tile-repository">
      <TileRepositoryPage />
    </StaffGuard>
  ),
});

function TileRepositoryPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-5xl w-full space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Tile Repository</h1>
        <p className="text-sm text-muted-foreground">
          Shared collection of tiles used across tile race events.
        </p>
      </div>
      <RepositoryList />
    </div>
  );
}
