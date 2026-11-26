import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { PageHead } from "@/components/layout/PageHead";

export const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calendar",
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-6">
      <PageHead title="Calendar" lede="Upcoming clan events and activities." />
      <div className="h-svh min-h-160 overflow-hidden rounded-xl border border-border bg-card">
        <iframe
          src="https://teamup.com/ksu6d1cq6fsn5ait2t"
          title="Iron Foundry Events Calendar"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
