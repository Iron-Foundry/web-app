import { createRoute } from "@tanstack/react-router";
import { resourcesLayoutRoute } from "./_layout";
import { ContentIndexPage } from "@/components/content/ContentIndexPage";

export const resourcesIndexRoute = createRoute({
  getParentRoute: () => resourcesLayoutRoute,
  path: "/",
  component: ResourcesIndex,
});

function ResourcesIndex() {
  return (
    <ContentIndexPage description="Community guides and resource articles." />
  );
}
