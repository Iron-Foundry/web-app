import { createRoute } from "@tanstack/react-router";
import { resourcesLayoutRoute } from "./_layout";
import { ContentEntryPage } from "@/components/content/ContentEntryPage";

export const resourcesEntryRoute = createRoute({
  getParentRoute: () => resourcesLayoutRoute,
  path: "/$entryId",
  component: ResourcesEntry,
});

function ResourcesEntry() {
  const { entryId } = resourcesEntryRoute.useParams();
  return <ContentEntryPage entryId={entryId} routeBase="/resources" />;
}
