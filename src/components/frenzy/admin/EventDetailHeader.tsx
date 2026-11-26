import { DoorClosed, DoorOpen, RefreshCw, Save, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActivateEvent, useDeactivateEvent, useSyncEventFromWom } from "@/hooks/useFrenzyEvents";
import { useSetFrenzySignupsOpen } from "@/hooks/useFrenzySignups";
import type { FrenzyEventSummary } from "@/types/frenzy";

interface Props {
  event: FrenzyEventSummary;
  signupsOpen: boolean;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  onSynced: (startsAt: string | null, endsAt: string | null) => void;
}

const fail = (err: unknown): void => {
  toast.error(String(err));
};

/** The event editor's head: back, Sync WOM, open or close signups, activate or deactivate, and Save. */
export function EventDetailHeader({ event, signupsOpen, onBack, onSave, saving, onSynced }: Props): React.ReactElement {
  const activate = useActivateEvent();
  const deactivate = useDeactivateEvent();
  const syncWom = useSyncEventFromWom();
  const setSignups = useSetFrenzySignupsOpen();

  function toggleActive(): void {
    const question = event.is_active
      ? `Deactivate "${event.name}"? The public page will show no active event.`
      : `Set "${event.name}" as the active event?`;
    if (!confirm(question)) return;
    const action = event.is_active ? deactivate : activate;
    action.mutate(event.id, {
      onSuccess: () => toast.success(event.is_active ? "Event deactivated." : "Event activated."),
      onError: fail,
    });
  }

  function toggleSignups(): void {
    setSignups.mutate(
      { eventId: event.id, open: !signupsOpen },
      { onSuccess: () => toast.success(signupsOpen ? "Signups closed." : "Signups opened."), onError: fail },
    );
  }

  function sync(): void {
    syncWom.mutate(event.id, {
      onSuccess: (result) => {
        onSynced(result.starts_at, result.ends_at);
        toast.success(`WOM sync: ${result.teams_synced} team(s) synced.`);
      },
      onError: fail,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
      <h3 className="font-semibold">{event.name}</h3>
      {event.is_active && <Badge>Active</Badge>}
      {signupsOpen && <Badge variant="outline">Signups open</Badge>}
      <div className="ml-auto flex flex-wrap gap-2">
        {event.wom_comp_id && (
          <Button size="sm" variant="outline" onClick={sync} disabled={syncWom.isPending}>
            <RefreshCw className={syncWom.isPending ? "animate-spin motion-reduce:animate-none" : ""} />
            Sync WOM
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={toggleSignups} disabled={setSignups.isPending}>
          {signupsOpen ? <DoorClosed /> : <DoorOpen />}
          {signupsOpen ? "Close signups" : "Open signups"}
        </Button>
        <Button size="sm" variant="outline" onClick={toggleActive} disabled={activate.isPending || deactivate.isPending}>
          <Zap />
          {event.is_active ? "Deactivate" : "Activate"}
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          <Save />
          Save
        </Button>
      </div>
    </div>
  );
}
