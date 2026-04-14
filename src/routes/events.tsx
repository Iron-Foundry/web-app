import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calendar",
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="flex flex-col -m-6 h-[calc(100vh-3.5rem)]">
      <div className="px-6 pt-6 pb-3 space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Calendar</h1>
        <p className="text-muted-foreground">Upcoming clan events and activities.</p>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        <iframe
          src="https://teamup.com/ksu6d1cq6fsn5ait2t"
          title="Iron Foundry Events Calendar"
          className="w-full h-full rounded-md border border-border"
        />
      </div>
    </div>
  );
}
