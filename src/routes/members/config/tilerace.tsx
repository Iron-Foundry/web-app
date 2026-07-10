import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { registerPage } from "@/lib/permissions";
import { StaffGuard } from "@/components/StaffGuard";
import { GridConfig } from "@/components/tilerace/builder/GridConfig";
import { PathEditor } from "@/components/tilerace/builder/PathEditor";
import { TeamManager } from "@/components/tilerace/builder/TeamManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Play, Square, Trash2 } from "lucide-react";
import {
  useActivateTileraceEvent,
  useCreateTileraceEvent,
  useDeactivateTileraceEvent,
  useDeleteTileraceEvent,
  usePatchTileraceTeam,
  useSetFogOfWar,
  useTileraceEvent,
  useTileraceEvents,
} from "@/hooks/useTilerace";
import type { TileRaceEventSummary } from "@/types/tilerace";
import { formatTileRaceDate } from "@/lib/tilerace";

registerPage({
  id: "tilerace.admin",
  label: "Tile Race Admin",
  description: "Manage Tile Race events, paths, and teams.",
  defaults: {
    read: ["Foundry Mentors"],
    create: ["Foundry Mentors"],
    edit: ["Foundry Mentors"],
    delete: ["Senior Moderator"],
  },
});

export const staffTileraceRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/config/tilerace",
  component: () => (
    <StaffGuard pageId="tilerace.admin">
      <StaffTileracePage />
    </StaffGuard>
  ),
});

type Tab = "builder" | "events" | "teams" | "controls";

const TAB_LABELS: Record<Tab, string> = {
  builder: "Builder",
  events: "Events",
  teams: "Teams",
  controls: "Controls",
};

function EventsTab({
  onSelectEvent,
  selectedEventId,
}: {
  onSelectEvent: (id: string) => void;
  selectedEventId: string | null;
}): JSX.Element {
  const { data: events = [] } = useTileraceEvents();
  const { mutate: createEvent, isPending: creating } = useCreateTileraceEvent();
  const { mutate: deleteEvent } = useDeleteTileraceEvent();
  const { mutate: activateEvent } = useActivateTileraceEvent();
  const { mutate: deactivateEvent } = useDeactivateTileraceEvent();
  const [newName, setNewName] = useState("");

  function handleCreate() {
    if (!newName.trim()) return;
    createEvent(
      { name: newName.trim(), grid_cols: 10, grid_rows: 5 },
      {
        onSuccess: (result) => {
          setNewName("");
          onSelectEvent(result.id);
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">New Event Name</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Event name"
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <Button size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
          Create
        </Button>
      </div>

      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">No events yet.</p>
      )}

      <div className="space-y-2">
        {events.map((ev) => (
          <div
            key={ev.id}
            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
              selectedEventId === ev.id ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => onSelectEvent(ev.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{ev.name}</span>
                {ev.is_active && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-600 border-green-500/30">
                    Active
                  </Badge>
                )}
              </div>
              {ev.starts_at && (
                <p className="text-xs text-muted-foreground">
                  {formatTileRaceDate(ev.starts_at)}
                  {ev.ends_at && ` - ${formatTileRaceDate(ev.ends_at)}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() =>
                  ev.is_active ? deactivateEvent(ev.id) : activateEvent(ev.id)
                }
              >
                {ev.is_active ? (
                  <Square className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  if (confirm(`Delete "${ev.name}"?`)) deleteEvent(ev.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ControlsTab({ eventId }: { eventId: string }): JSX.Element {
  const { data: event } = useTileraceEvent(eventId);
  const { mutate: setFogOfWar, isPending: fogPending } = useSetFogOfWar();
  const { mutate: patchTeam } = usePatchTileraceTeam();

  if (!event) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">Fog of War</p>
          <p className="text-xs text-muted-foreground">
            When enabled, tiles beyond the furthest team position are hidden from all viewers.
          </p>
          <Button
            size="sm"
            variant={event.fog_of_war ? "default" : "outline"}
            disabled={fogPending}
            onClick={() => setFogOfWar({ eventId, enabled: !event.fog_of_war })}
            className="gap-1.5"
          >
            {event.fog_of_war ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Fog On
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Fog Off
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Team Positions</p>
        <p className="text-xs text-muted-foreground">Manually set a team's current step.</p>
        {event.teams.map((team) => (
          <div key={team.id} className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
            <span className="text-sm flex-1 truncate">{team.name}</span>
            <Input
              type="number"
              min={0}
              defaultValue={team.position}
              className="h-7 w-20 text-sm text-center"
              onBlur={(e) => {
                const pos = Math.max(0, Number(e.target.value));
                if (pos !== team.position) {
                  patchTeam({ eventId, teamId: team.id, data: { position: pos } });
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffTileracePage(): JSX.Element {
  const [tab, setTab] = useState<Tab>("events");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { data: selectedEvent } = useTileraceEvent(selectedEventId ?? "");

  return (
    <div className="mx-auto max-w-5xl w-full space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Tile Race</h1>
        <p className="text-sm text-muted-foreground">
          Manage tile race events, path layouts, and teams.
        </p>
      </div>

      <div className="flex gap-2 border-b pb-0">
        {(["events", "builder", "teams", "controls"] as Tab[]).map((t) => (
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

      {selectedEventId && tab !== "events" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Event:</span>
          <span className="font-medium text-foreground">{selectedEvent?.name ?? selectedEventId}</span>
          <button
            onClick={() => setTab("events")}
            className="ml-auto text-xs underline underline-offset-2 hover:no-underline"
          >
            Change
          </button>
        </div>
      )}

      {tab === "events" && (
        <EventsTab
          onSelectEvent={(id) => {
            setSelectedEventId(id);
            setTab("builder");
          }}
          selectedEventId={selectedEventId}
        />
      )}

      {tab === "builder" && !selectedEventId && (
        <p className="text-sm text-muted-foreground">Select an event first.</p>
      )}

      {tab === "builder" && selectedEventId && selectedEvent && (
        <div className="space-y-4">
          <GridConfig event={selectedEvent} />
          <Separator />
          <PathEditor event={selectedEvent} />
        </div>
      )}

      {tab === "teams" && !selectedEventId && (
        <p className="text-sm text-muted-foreground">Select an event first.</p>
      )}

      {tab === "teams" && selectedEventId && selectedEvent && (
        <TeamManager event={selectedEvent} />
      )}

      {tab === "controls" && !selectedEventId && (
        <p className="text-sm text-muted-foreground">Select an event first.</p>
      )}

      {tab === "controls" && selectedEventId && (
        <ControlsTab eventId={selectedEventId} />
      )}
    </div>
  );
}
