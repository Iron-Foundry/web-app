import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { Separator } from "@/components/ui/separator";

export const resourcesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/resources",
  component: ResourcesPage,
});

function ResourcesPage() {
  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Resources & Guides</h1>
      </div>
      <Separator />
    </div>
  );
}
