import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTemplates, useCreateEvent, useEvents } from "@/hooks/useFrenzy";
import type { FrenzyEventSummary } from "@/types/frenzy";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { EventDetailEditor } from "./EventDetailEditor";

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
