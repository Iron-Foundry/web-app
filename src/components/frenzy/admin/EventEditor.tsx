import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TeamManager } from "./TeamManager";
import {
  useTemplates,
  useCreateEvent,
  usePatchEvent,
  useActivateEvent,
  useDeactivateEvent,
  useDeleteEvent,
  useEvent,
  useEvents,
  useSyncEventFromWom,
} from "@/hooks/useFrenzy";
import type { FrenzyEventSummary } from "@/types/frenzy";
import { ChevronRight, Plus, RefreshCw, Save, Zap } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Event detail editor
// ---------------------------------------------------------------------------

interface EditorProps {
  event: FrenzyEventSummary;
  onBack: () => void;
}

function EventDetailEditor({ event, onBack }: EditorProps) {
  const { data: detail, isLoading } = useEvent(event.id);
  const { data: templates } = useTemplates();
  const patchEvent = usePatchEvent();
  const activateEvent = useActivateEvent();
  const deactivateEvent = useDeactivateEvent();
  const deleteEvent = useDeleteEvent();
  const syncWom = useSyncEventFromWom();

  const [name, setName] = useState(event.name);
  const [wom, setWom] = useState(String(event.wom_comp_id ?? ""));
  const [startsAt, setStartsAt] = useState(event.starts_at ? event.starts_at.slice(0, 16) : "");
  const [endsAt, setEndsAt] = useState(event.ends_at ? event.ends_at.slice(0, 16) : "");

  async function handleSave() {
    try {
      await patchEvent.mutateAsync({
        id: event.id,
        data: {
          name: name || undefined,
          wom_comp_id: wom ? Number(wom) : null,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        },
      });
      toast.success("Event saved.");
    } catch (err: unknown) {
      toast.error(String(err));
    }
  }

  async function handleActivate() {
    if (!confirm(`Set "${event.name}" as the active event?`)) return;
    try {
      await activateEvent.mutateAsync(event.id);
      toast.success("Event activated.");
    } catch (err: unknown) {
      toast.error(String(err));
    }
  }

  async function handleDeactivate() {
    if (!confirm(`Deactivate "${event.name}"? The public page will show no active event.`)) return;
    try {
      await deactivateEvent.mutateAsync(event.id);
      toast.success("Event deactivated.");
    } catch (err: unknown) {
      toast.error(String(err));
    }
  }

  async function handleSyncWom() {
    try {
      const result = await syncWom.mutateAsync(event.id);
      if (result.starts_at) setStartsAt(result.starts_at.slice(0, 16));
      if (result.ends_at) setEndsAt(result.ends_at.slice(0, 16));
      toast.success(`WOM sync: ${result.teams_synced} team(s) synced.`);
    } catch (err: unknown) {
      toast.error(String(err));
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete event "${event.name}"? All team data will be lost.`)) return;
    try {
      await deleteEvent.mutateAsync(event.id);
      toast.success("Event deleted.");
      onBack();
    } catch (err: unknown) {
      toast.error(String(err));
    }
  }

  const templateName = templates?.find((t) => t.id === event.template_id)?.name ?? "Unknown";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <h3 className="font-semibold">{event.name}</h3>
        {event.is_active && <Badge>Active</Badge>}
        <div className="ml-auto flex gap-2">
          {event.wom_comp_id && (
            <Button size="sm" variant="outline" onClick={handleSyncWom} disabled={syncWom.isPending}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncWom.isPending ? "animate-spin" : ""}`} />
              Sync WOM
            </Button>
          )}
          {event.is_active ? (
            <Button size="sm" variant="outline" onClick={handleDeactivate} disabled={deactivateEvent.isPending}>
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Deactivate
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handleActivate} disabled={activateEvent.isPending}>
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Activate
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={patchEvent.isPending}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Event name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Template</Label>
          <Input value={templateName} disabled className="bg-muted" />
        </div>
        <div>
          <Label>WOM Competition ID</Label>
          <Input
            type="number"
            value={wom}
            onChange={(e) => setWom(e.target.value)}
            placeholder="e.g. 90513"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Starts at</Label>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <Label>Ends at</Label>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading teams...</p>
      ) : detail ? (
        <TeamManager event={detail} />
      ) : null}

      <div className="border-t pt-3">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={event.is_active || deleteEvent.isPending}
        >
          Delete Event
        </Button>
        {event.is_active && (
          <p className="text-xs text-muted-foreground mt-1">Deactivate before deleting.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event list
// ---------------------------------------------------------------------------

export function EventList() {
  const { data: events, isLoading } = useEvents();
  const { data: templates } = useTemplates();
  const createEvent = useCreateEvent();
  const [editingEvent, setEditingEvent] = useState<FrenzyEventSummary | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTemplateId, setNewTemplateId] = useState("");

  if (editingEvent) {
    return <EventDetailEditor event={editingEvent} onBack={() => setEditingEvent(null)} />;
  }

  async function handleCreate() {
    if (!newName.trim() || !newTemplateId) return;
    try {
      await createEvent.mutateAsync({ name: newName.trim(), template_id: Number(newTemplateId) });
      setNewName("");
      setNewTemplateId("");
      setShowCreate(false);
      toast.success("Event created.");
    } catch (err: unknown) {
      toast.error(String(err));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-lg border bg-card p-3 space-y-2">
          <h4 className="font-medium text-sm">Create Event</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Event name"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Template</Label>
              <select
                value={newTemplateId}
                onChange={(e) => setNewTemplateId(e.target.value)}
                className="h-8 w-full rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Select template...</option>
                {(templates ?? []).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newName || !newTemplateId || createEvent.isPending}
            >
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && (events ?? []).length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground">No events yet.</p>
      )}
      {(events ?? []).map((e) => (
        <div
          key={e.id}
          role="button"
          tabIndex={0}
          className="flex items-center gap-2 rounded-lg border bg-card p-3 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setEditingEvent(e)}
          onKeyDown={(ev) => ev.key === "Enter" && setEditingEvent(e)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{e.name}</span>
              {e.is_active && <Badge>Active</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {e.starts_at
                ? `${new Date(e.starts_at).toLocaleDateString()} - ${
                    e.ends_at ? new Date(e.ends_at).toLocaleDateString() : "ongoing"
                  }`
                : "No dates set"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      ))}
    </div>
  );
}
