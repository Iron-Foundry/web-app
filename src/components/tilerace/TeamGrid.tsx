import { buildPathPositionMap } from "@/lib/tilerace";
import type { TileCompletion, TileRacePublicEvent, TileRaceRoll } from "@/types/tilerace";
import { TeamCard } from "./TeamCard";
import { DiceRoller } from "./DiceRoller";
import { RecentRollsPanel } from "./RecentRollsPanel";

interface Props {
  event: TileRacePublicEvent;
  completions: TileCompletion[];
  rolls: TileRaceRoll[];
  rollingTeamIds: Set<string>;
  signedIn: boolean;
}

/** True while the team stands on a tile it has not claimed or had approved yet. */
export function isGated(teamId: string, position: number, tileId: string | null | undefined, completions: TileCompletion[]): boolean {
  return !!tileId && !completions.some(
    (c) => c.team_id === teamId && c.path_position === position && (c.status === "claimed" || c.status === "approved"),
  );
}

/** The team cards with their dice, beside the recent rolls. */
export function TeamGrid({ event, completions, rolls, rollingTeamIds, signedIn }: Props): React.ReactElement {
  const pathPositionMap = buildPathPositionMap(event.cells);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 xl:grid-cols-3">
        {event.teams.map((team) => {
          const currentCell = pathPositionMap.get(team.position);
          return (
            <TeamCard key={team.id} team={team} currentCell={currentCell} isRolling={rollingTeamIds.has(team.id)}>
              {signedIn && (
                <DiceRoller
                  eventId={event.id}
                  team={team}
                  isMember={event.my_team_id === team.id}
                  diceCount={event.dice_count}
                  diceSides={event.dice_sides}
                  gated={isGated(team.id, team.position, currentCell?.tile_id, completions)}
                  finished={event.is_finished}
                  paused={event.rolls_paused}
                />
              )}
            </TeamCard>
          );
        })}
      </div>
      <div className="relative">
        <RecentRollsPanel rolls={rolls} teams={event.teams} />
      </div>
    </div>
  );
}
