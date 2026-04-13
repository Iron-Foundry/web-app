import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calendar",
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Calendar</h1>
        <p className="text-muted-foreground">Upcoming clan events and activities.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <iframe
          src="https://teamup.com/ksu6d1cq6fsn5ait2t"
          title="Iron Foundry Events Calendar"
          className="w-full"
          style={{ height: "900px" }}
          frameBorder="0"
        />
      </div>
    </div>
  );
}
