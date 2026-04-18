import { createRoute } from "@tanstack/react-router";
import { pluginsLayoutRoute } from "./_layout";
import { ContentEntryPage } from "@/components/content/ContentEntryPage";

export const pluginsEntryRoute = createRoute({
  getParentRoute: () => pluginsLayoutRoute,
  path: "/$entryId",
  component: PluginsEntry,
});

function PluginsEntry() {
  const { entryId } = pluginsEntryRoute.useParams();
  return <ContentEntryPage entryId={entryId} routeBase="/plugins" />;
}
