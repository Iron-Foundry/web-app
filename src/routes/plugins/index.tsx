import { createRoute } from "@tanstack/react-router";
import { pluginsLayoutRoute } from "./_layout";
import { ContentIndexPage } from "@/components/content/ContentIndexPage";

export const pluginsIndexRoute = createRoute({
  getParentRoute: () => pluginsLayoutRoute,
  path: "/",
  component: PluginsIndex,
});

function PluginsIndex() {
  return (
    <ContentIndexPage description="Browse RuneLite plugin listings and recommendations." />
  );
}
