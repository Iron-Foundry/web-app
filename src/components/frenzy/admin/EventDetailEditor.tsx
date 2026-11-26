import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteEvent, useEvent, usePatchEvent, useTemplates } from "@/hooks/useFrenzy";
import type { FrenzyEventSummary } from "@/types/frenzy";
import { DraftSetup } from "./DraftSetup";
import { EventDetailHeader } from "./EventDetailHeader";
import { TeamManager } from "./TeamManager";

interface Props {
  event: FrenzyEventSummary;
  onBack: () => void;
}

const toLocalInput = (iso: string | null): string => (iso ? iso.slice(0, 16) : "");
const toIso = (local: string): string | null => (local ? new Date(local).toISOString() : null);

/** One frenzy event's settings, teams and deletion. */
export function EventDetailEditor({ event, onBack }: Props): React.ReactElement {
  const { data: detail, isLoading } = useEvent(event.id);
  const { data: templates } = useTemplates();
  const patchEvent = usePatchEvent();
  const deleteEvent = useDeleteEvent();

  const [name, setName] = useState(event.name);
  const [wom, setWom] = useState(String(event.wom_comp_id ?? ""));
  const [startsAt, setStartsAt] = useState(toLocalInput(event.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(event.ends_at));

  function save(): void {
    patchEvent.mutate(
      { id: event.id, data: { name: name || undefined, wom_comp_id: wom ? Number(wom) : null, starts_at: toIso(startsAt), ends_at: toIso(endsAt) } },
      { onSuccess: () => toast.success("Event saved."), onError: (err) => toast.error(String(err)) },
    );
  }

  function remove(): void {
    if (!confirm(`Delete event "${event.name}"? All team data will be lost.`)) return;
    deleteEvent.mutate(event.id, {
      onSuccess: () => { toast.success("Event deleted."); onBack(); },
      onError: (err) => toast.error(String(err)),
    });
  }

  const templateName = templates?.find((t) => t.id === event.template_id)?.name ?? "Unknown";

  return (
    <div className="space-y-4">
      <EventDetailHeader
        event={event}
        signupsOpen={detail?.signups_open ?? event.signups_open}
        onBack={onBack}
        onSave={save}
        saving={patchEvent.isPending}
        onSynced={(s, e) => {
          if (s) setStartsAt(toLocalInput(s));
          if (e) setEndsAt(toLocalInput(e));
        }}
      />

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
          <Input type="number" value={wom} onChange={(e) => setWom(e.target.value)} placeholder="e.g. 90513" />
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

      <DraftSetup eventId={event.id} />

      {isLoading ? <p className="text-sm text-muted-foreground">Loading teams...</p> : detail ? <TeamManager event={detail} /> : null}

      <div className="border-t pt-3">
        <Button variant="destructive" size="sm" onClick={remove} disabled={event.is_active || deleteEvent.isPending}>
          Delete Event
        </Button>
        {event.is_active && <p className="mt-1 text-xs text-muted-foreground">Deactivate before deleting.</p>}
      </div>
    </div>
  );
}
