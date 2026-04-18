import { createRoute } from "@tanstack/react-router";
import { pluginsLayoutRoute } from "./_layout";
import { useContentContext } from "@/components/content/ContentLayout";

export const pluginsIndexRoute = createRoute({
  getParentRoute: () => pluginsLayoutRoute,
  path: "/",
  component: PluginsIndex,
});

function PluginsIndex() {
  const { pageName } = useContentContext();
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="font-rs-bold text-4xl text-primary">{pageName}</h1>
      <p className="text-muted-foreground">
        Browse RuneLite plugin listings and recommendations. Select a topic from the sidebar to get
        started.
      </p>
    </div>
  );
}
