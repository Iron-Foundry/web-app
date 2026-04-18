import { createRoute } from "@tanstack/react-router";
import { resourcesLayoutRoute } from "./_layout";
import { ContentEntryPage } from "@/components/content/ContentEntryPage";

export const resourcesEntryRoute = createRoute({
  getParentRoute: () => resourcesLayoutRoute,
  path: "/$slug",
  component: ResourcesEntry,
});

function ResourcesEntry() {
  const { slug } = resourcesEntryRoute.useParams();
  return <ContentEntryPage slug={slug} routeBase="/resources" />;
}
