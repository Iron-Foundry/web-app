import { useCompletions, useToggleCompletion } from "@/hooks/useTilerace";
import { getPathCells } from "@/lib/tilerace";
import type { TileRaceEvent } from "@/types/tilerace";

interface CompletionsPanelProps {
  event: TileRaceEvent;
}

export function CompletionsPanel({ event }: CompletionsPanelProps): JSX.Element {
  const { data: completions = [] } = useCompletions(event.id);
  const { mutate: toggle } = useToggleCompletion();

  const tileCells = getPathCells(event.cells).filter((c) => c.tile_id);

  function isDone(teamId: string, pos: number): boolean {
    return completions.some(
      (c) => c.team_id === teamId && c.path_position === pos,
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Tile Completion</p>
      <p className="text-xs text-muted-foreground">
        Tick a team's current tile to unlock their roll. Teams cannot advance off a
        tile until it is marked complete.
      </p>
      {event.teams.map((team) => (
        <div key={team.id} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full shrink-0"
              style={{ backgroundColor: team.color }}
            />
            <span className="text-sm font-medium">{team.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              Step {team.position}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tileCells.map((cell) => {
              const pos = cell.path_position as number;
              const done = isDone(team.id, pos);
              const current = pos === team.position;
              return (
                <button
                  key={pos}
                  onClick={() =>
                    toggle({
                      eventId: event.id,
                      teamId: team.id,
                      pathPosition: pos,
                      completed: !done,
                    })
                  }
                  title={cell.tile?.title ?? `Tile ${pos}`}
                  className={`h-7 w-7 rounded text-xs font-medium border transition-colors ${
                    done
                      ? "bg-green-500/20 border-green-500/50 text-green-600"
                      : "border-border text-muted-foreground hover:border-foreground/40"
                  } ${current ? "ring-2 ring-primary" : ""}`}
                >
                  {pos}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
