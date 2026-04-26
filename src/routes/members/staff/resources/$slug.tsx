import { createRoute } from "@tanstack/react-router";
import { staffResourcesLayoutRoute } from "./_layout";
import { ContentEntryPage } from "@/components/content/ContentEntryPage";

export const staffResourcesEntryRoute = createRoute({
  getParentRoute: () => staffResourcesLayoutRoute,
  path: "/$slug",
  component: StaffResourcesEntry,
});

function StaffResourcesEntry() {
  const { slug } = staffResourcesEntryRoute.useParams();
  return <ContentEntryPage slug={slug} routeBase="/members/staff/resources" />;
}
