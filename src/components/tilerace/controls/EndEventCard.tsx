import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag } from "lucide-react";
import { usePatchTileraceEvent } from "@/hooks/useTilerace";
import type { TileRaceEvent } from "@/types/tilerace";

const NO_WINNER = "none";

interface Props {
  event: TileRaceEvent;
}

/**
 * End the event by hand, or reopen it.
 *
 * A finish pad only ends the game when its `ends_game` trigger is on, so an
 * event raced to a pad that does not end it has no other way to conclude -
 * deactivating hides it, which is how staff switch which event is live, not how
 * they finish one.
 */
export function EndEventCard({ event }: Props): JSX.Element {
  const { mutate: patchEvent, isPending } = usePatchTileraceEvent();
  const ranked = [...event.teams].sort((a, b) => b.position - a.position);
  const [winnerId, setWinnerId] = useState(ranked[0]?.id ?? NO_WINNER);

  if (event.is_finished) {
    const winner = event.teams.find((t) => t.id === event.winner_team_id);
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">Game Over</p>
          <p className="text-xs text-muted-foreground">
            Rolls are locked and the public page shows the recap
            {winner ? `, won by ${winner.name}` : " with no winner recorded"}.
            Reset to reopen rolling.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => patchEvent({ id: event.id, data: { is_finished: false } })}
          >
            Reset Game
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold">End the event</p>
        <p className="text-xs text-muted-foreground">
          Locks rolls for every team and swaps the public page over to the recap.
          A finish pad does this on its own only when it is set to end the game;
          end it here otherwise. Teams are listed by board position.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Select value={winnerId} onValueChange={setWinnerId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Winning team" />
            </SelectTrigger>
            <SelectContent>
              {ranked.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name} - tile {team.position}
                </SelectItem>
              ))}
              <SelectItem value={NO_WINNER}>No winner</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={isPending}
            className="gap-1.5"
            onClick={() =>
              patchEvent({
                id: event.id,
                data: {
                  is_finished: true,
                  winner_team_id: winnerId === NO_WINNER ? null : Number(winnerId),
                },
              })
            }
          >
            <Flag className="h-3.5 w-3.5" />
            End event
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
