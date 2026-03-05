import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold text-primary">About Us</h1>
      <p className="text-muted-foreground">
        Iron Foundry is an Old School RuneScape community. Content coming soon.
      </p>
    </div>
  );
}