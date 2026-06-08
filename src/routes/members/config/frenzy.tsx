import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { registerPage } from "@/lib/permissions";
import { StaffGuard } from "@/components/StaffGuard";
import { TemplateList } from "@/components/frenzy/admin/TemplateList";
import { EventList } from "@/components/frenzy/admin/EventEditor";
import { FrenzySubmissionFeed } from "@/components/frenzy/admin/FrenzySubmissionFeed";
import { useActiveEvent, useEvent, useEvents } from "@/hooks/useFrenzy";

registerPage({
  id: "frenzy.admin",
  label: "PVM Frenzy Admin",
  description: "Manage PVM Frenzy templates and events.",
  defaults: {
    read: ["Foundry Mentors"],
    create: ["Foundry Mentors"],
    edit: ["Foundry Mentors"],
    delete: ["Senior Moderator"],
  },
});

export const staffFrenzyRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/config/frenzy",
  component: () => (
    <StaffGuard pageId="frenzy.admin">
      <StaffFrenzyPage />
    </StaffGuard>
  ),
});

type Tab = "templates" | "events" | "submissions";

function SubmissionsTab() {
  const { data: activeEvent } = useActiveEvent();
  const { data: events } = useEvents();

  // Prefer the active event; fall back to most recent event
  const eventId = activeEvent?.id ?? events?.[0]?.id;
  const { data: eventDetail } = useEvent(eventId ?? 0);

  if (!eventId) {
    return <p className="text-sm text-muted-foreground">No events found.</p>;
  }

  const teams = eventDetail?.teams ?? [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Showing submissions for:{" "}
        <span className="font-medium text-foreground">{eventDetail?.name ?? "Loading..."}</span>
      </p>
      <FrenzySubmissionFeed eventId={eventId} teams={teams} />
    </div>
  );
}

function StaffFrenzyPage() {
  const [tab, setTab] = useState<Tab>("templates");

  const TAB_LABELS: Record<Tab, string> = {
    templates: "Templates",
    events: "Events",
    submissions: "Submissions",
  };

  return (
    <div className="mx-auto max-w-4xl w-full space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">PVM Frenzy</h1>
        <p className="text-sm text-muted-foreground">Manage scoring templates and event instances.</p>
      </div>

      <div className="flex gap-2 border-b pb-0">
        {(["templates", "events", "submissions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "templates" && <TemplateList />}
      {tab === "events" && <EventList />}
      {tab === "submissions" && <SubmissionsTab />}
    </div>
  );
}
