import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { usePatchTileraceTeam } from "@/hooks/useTilerace";
import type { TileRaceTeam } from "@/types/tilerace";

interface TeamPositionInputProps {
  eventId: string;
  team: TileRaceTeam;
}

function TeamPositionInput({ eventId, team }: TeamPositionInputProps): JSX.Element {
  const { mutate: patchTeam, isPending } = usePatchTileraceTeam();
  const [value, setValue] = useState(String(team.position));

  useEffect(() => {
    setValue(String(team.position));
  }, [team.position]);

  function commit(): void {
    const parsed = Number(value);
    const pos = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : team.position;
    setValue(String(pos));
    if (pos !== team.position) {
      patchTeam({ eventId, teamId: team.id, data: { position: pos } });
    }
  }

  const dirty = Number(value) !== team.position;

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min={0}
        value={value}
        disabled={isPending}
        className="h-7 w-20 text-sm text-center"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        onBlur={commit}
      />
      {dirty && (
        <Button
          size="icon"
          variant="default"
          className="h-7 w-7 shrink-0"
          disabled={isPending}
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
          title="Save position"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

interface Props {
  eventId: string;
  teams: TileRaceTeam[];
}

export function TeamPositions({ eventId, teams }: Props): JSX.Element {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Team Positions</p>
      <p className="text-xs text-muted-foreground">Manually set a team's current step.</p>
      {teams.map((team) => (
        <div key={team.id} className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full shrink-0"
            style={{ backgroundColor: team.color }}
          />
          <span className="text-sm flex-1 truncate">{team.name}</span>
          <TeamPositionInput eventId={eventId} team={team} />
        </div>
      ))}
    </div>
  );
}
