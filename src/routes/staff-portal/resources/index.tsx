import { createRoute } from "@tanstack/react-router";
import { staffPortalResourcesLayoutRoute } from "./_layout";
import { ContentIndexPage } from "@/components/content/ContentIndexPage";

export const staffPortalResourcesIndexRoute = createRoute({
  getParentRoute: () => staffPortalResourcesLayoutRoute,
  path: "/",
  component: StaffPortalResourcesIndex,
});

function StaffPortalResourcesIndex() {
  return (
    <ContentIndexPage description="Internal guides and reference material for staff members." />
  );
}
