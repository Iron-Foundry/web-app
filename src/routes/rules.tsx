import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rules",
  component: RulesPage,
});

function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold text-primary">Clan Rules</h1>
      <p className="text-muted-foreground">Rules content coming soon.</p>
    </div>
  );
}