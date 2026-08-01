import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Pause, Play } from "lucide-react";
import {
  usePatchTileraceEvent,
  useSetFogOfWar,
  useTileraceEvent,
} from "@/hooks/useTilerace";
import { CompletionsPanel } from "./CompletionsPanel";
import { DiceSettingsCard } from "./DiceSettingsCard";
import { DiscordCard } from "./DiscordCard";
import { DiscordPermissionsCard } from "./DiscordPermissionsCard";
import { TeamPositions } from "./TeamPositions";

interface ControlsTabProps {
  eventId: string;
}

export function ControlsTab({ eventId }: ControlsTabProps): JSX.Element {
  const { data: event } = useTileraceEvent(eventId);
  const { mutate: setFogOfWar, isPending: fogPending } = useSetFogOfWar();
  const { mutate: patchEvent, isPending: patching } = usePatchTileraceEvent();

  if (!event) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">Rolling</p>
          <p className="text-xs text-muted-foreground">
            Pause blocks every team from rolling without ending the game. Use it
            while fixing a board or settling a dispute; the roll button goes dead
            for everyone and the API refuses a roll even if someone gets past it.
          </p>
          <Button
            size="sm"
            variant={event.rolls_paused ? "default" : "outline"}
            disabled={patching}
            onClick={() =>
              patchEvent({
                id: eventId,
                data: { rolls_paused: !event.rolls_paused },
              })
            }
            className="gap-1.5"
          >
            {event.rolls_paused ? (
              <>
                <Play className="h-3.5 w-3.5" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">Fog of War</p>
          <p className="text-xs text-muted-foreground">
            When enabled, tiles beyond the furthest team position are hidden and shown
            as a "?" to all viewers.
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

      <DiceSettingsCard event={event} />

      <DiscordCard event={event} />

      <DiscordPermissionsCard event={event} />

      {event.is_finished && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">Game Over</p>
            <p className="text-xs text-muted-foreground">
              A team reached the finish pad, so rolls are locked. Reset to reopen rolling.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => patchEvent({ id: eventId, data: { is_finished: false } })}
            >
              Reset Game
            </Button>
          </CardContent>
        </Card>
      )}

      <CompletionsPanel event={event} />

      <TeamPositions eventId={eventId} teams={event.teams} />
    </div>
  );
}
