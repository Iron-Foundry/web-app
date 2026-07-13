import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  usePatchTileraceEvent,
  usePatchTileraceTeam,
  useSetFogOfWar,
  useTileraceEvent,
} from "@/hooks/useTilerace";
import { CompletionsPanel } from "./CompletionsPanel";

interface ControlsTabProps {
  eventId: string;
}

export function ControlsTab({ eventId }: ControlsTabProps): JSX.Element {
  const { data: event } = useTileraceEvent(eventId);
  const { mutate: setFogOfWar, isPending: fogPending } = useSetFogOfWar();
  const { mutate: patchTeam } = usePatchTileraceTeam();
  const { mutate: patchEvent } = usePatchTileraceEvent();

  if (!event) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
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

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">Dice</p>
          <p className="text-xs text-muted-foreground">
            Set how many dice a roll uses and how many sides each die has (1-20).
          </p>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Dice</Label>
              <Input
                type="number"
                min={1}
                max={5}
                defaultValue={event.dice_count}
                className="h-8 w-20 text-sm"
                onBlur={(e) => {
                  const count = Math.min(5, Math.max(1, Number(e.target.value)));
                  if (count !== event.dice_count) {
                    patchEvent({ id: eventId, data: { dice_count: count } });
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sides</Label>
              <Input
                type="number"
                min={1}
                max={20}
                defaultValue={event.dice_sides}
                className="h-8 w-20 text-sm"
                onBlur={(e) => {
                  const sides = Math.min(20, Math.max(1, Number(e.target.value)));
                  if (sides !== event.dice_sides) {
                    patchEvent({ id: eventId, data: { dice_sides: sides } });
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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

      <div className="space-y-2">
        <p className="text-sm font-semibold">Team Positions</p>
        <p className="text-xs text-muted-foreground">Manually set a team's current step.</p>
        {event.teams.map((team) => (
          <div key={team.id} className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full shrink-0"
              style={{ backgroundColor: team.color }}
            />
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
