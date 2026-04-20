import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { registerPage } from "@/lib/permissions";
import { ContentLayout } from "@/components/content/ContentLayout";

registerPage({
  id: "plugins",
  label: "Plugins",
  description: "RuneLite plugin listings and recommendations.",
  defaults: { read: [], create: ["Foundry Mentors"], edit: ["Foundry Mentors"], delete: ["Senior Moderator"] },
});

export const pluginsLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/plugins",
  component: PluginsLayout,
});

function PluginsLayout() {
  return (
    <ContentLayout
      pageType="plugin"
      pageName="Plugins"
      pageId="plugins"
      routeBase="/plugins"
    />
  );
}
