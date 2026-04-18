import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { registerPage } from "@/lib/permissions";
import { ContentLayout } from "@/components/content/ContentLayout";

registerPage({
  id: "resources",
  label: "Resources & Guides",
  description: "Community guides and resource articles.",
  defaults: { read: [], create: ["Mentor"], edit: ["Mentor"], delete: ["Senior Moderator"] },
});

export const resourcesLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/resources",
  component: ResourcesLayout,
});

function ResourcesLayout() {
  return (
    <ContentLayout
      pageType="resource"
      pageName="Resources & Guides"
      pageId="resources"
      routeBase="/resources"
    />
  );
}
