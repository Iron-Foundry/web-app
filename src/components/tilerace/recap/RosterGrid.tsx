import { Badge } from "@/components/ui/badge";
import { RecapCard } from "./RecapCard";
import type { TileRaceRecapTeam } from "@/types/tilerace";

interface Props {
  teams: TileRaceRecapTeam[];
}

export function RosterGrid({ teams }: Props): JSX.Element {
  return (
    <RecapCard
      title="Rosters at close"
      description="The roster as it stood when the event ended. Captains marked."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {teams.map((team) => (
          <div key={team.id} className="rounded-lg border p-3">
            <div className="flex items-center gap-2 font-medium mb-2">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ background: team.color }}
              />
              {team.name}
              <span className="ml-auto text-xs text-muted-foreground">
                tile {team.position}
              </span>
            </div>
            {team.roster.length === 0 ? (
              <p className="text-xs text-muted-foreground">No racers on the roster.</p>
            ) : (
              team.roster.map((racer) => (
                <div
                  key={racer.rsn}
                  className="flex items-center gap-2 text-sm py-0.5"
                >
                  {racer.rsn}
                  {racer.is_captain && (
                    <Badge variant="outline" className="ml-auto text-[0.6rem]">
                      captain
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </RecapCard>
  );
}
