import { createRoute } from "@tanstack/react-router";
import { resourcesLayoutRoute } from "./_layout";
import { useContentContext } from "@/components/content/ContentLayout";

export const resourcesIndexRoute = createRoute({
  getParentRoute: () => resourcesLayoutRoute,
  path: "/",
  component: ResourcesIndex,
});

function ResourcesIndex() {
  const { pageName } = useContentContext();
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="font-rs-bold text-4xl text-primary">{pageName}</h1>
      <p className="text-muted-foreground">
        Community guides and resource articles. Select a topic from the sidebar to get started.
      </p>
    </div>
  );
}
