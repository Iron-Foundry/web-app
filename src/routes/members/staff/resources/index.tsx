import { createRoute } from "@tanstack/react-router";
import { staffResourcesLayoutRoute } from "./_layout";
import { ContentIndexPage } from "@/components/content/ContentIndexPage";

export const staffResourcesIndexRoute = createRoute({
  getParentRoute: () => staffResourcesLayoutRoute,
  path: "/",
  component: StaffResourcesIndex,
});

function StaffResourcesIndex() {
  return (
    <ContentIndexPage description="Internal guides and reference material for staff members." />
  );
}
