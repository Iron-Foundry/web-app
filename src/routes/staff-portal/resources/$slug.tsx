import { createRoute } from "@tanstack/react-router";
import { staffPortalResourcesLayoutRoute } from "./_layout";
import { ContentEntryPage } from "@/components/content/ContentEntryPage";

export const staffPortalResourcesEntryRoute = createRoute({
  getParentRoute: () => staffPortalResourcesLayoutRoute,
  path: "/$slug",
  component: StaffPortalResourcesEntry,
});

function StaffPortalResourcesEntry() {
  const { slug } = staffPortalResourcesEntryRoute.useParams();
  return <ContentEntryPage slug={slug} routeBase="/staff-portal/resources" />;
}
