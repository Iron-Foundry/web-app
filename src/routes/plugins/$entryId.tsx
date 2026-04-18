import { createRoute } from "@tanstack/react-router";
import { pluginsLayoutRoute } from "./_layout";
import { ContentEntryPage } from "@/components/content/ContentEntryPage";

export const pluginsEntryRoute = createRoute({
  getParentRoute: () => pluginsLayoutRoute,
  path: "/$slug",
  component: PluginsEntry,
});

function PluginsEntry() {
  const { slug } = pluginsEntryRoute.useParams();
  return <ContentEntryPage slug={slug} routeBase="/plugins" />;
}
