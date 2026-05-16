import { createRoute } from "@tanstack/react-router";
import { staffPortalLayoutRoute } from "../_layout";
import { registerPage } from "@/lib/permissions";
import { ContentLayout } from "@/components/content/ContentLayout";

registerPage({
  id: "staff.resources",
  label: "Staff Resources",
  description: "Internal guides and reference material for staff members.",
  defaults: {
    read: ["Foundry Mentors"],
    create: ["Foundry Mentors"],
    edit: ["Foundry Mentors"],
    delete: ["Senior Moderator"],
  },
});

export const staffPortalResourcesLayoutRoute = createRoute({
  getParentRoute: () => staffPortalLayoutRoute,
  path: "/resources",
  component: StaffPortalResourcesLayout,
});

function StaffPortalResourcesLayout() {
  return (
    <ContentLayout
      pageType="staff_resource"
      pageName="Staff Resources"
      pageId="staff.resources"
      routeBase="/staff-portal/resources"
    />
  );
}
