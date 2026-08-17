import { Card } from "@/components/ui/card";
import { RecapStats } from "./RecapStats";
import { PositionChart } from "./PositionChart";
import { DailySubmissionsChart } from "./DailySubmissionsChart";
import { StandingsTable } from "./StandingsTable";
import { ContributorsTable } from "./ContributorsTable";
import { RosterGrid } from "./RosterGrid";
import type { TileRaceRecap, TileRaceRecapTeam } from "@/types/tilerace";

function Outcome({
  winner,
  leader,
}: {
  winner: TileRaceRecapTeam | null;
  leader: TileRaceRecapTeam | null;
}): JSX.Element | null {
  const team = winner ?? leader;
  if (!team) return null;
  return (
    <Card className="p-6 border-primary/50 bg-primary/5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 rounded shrink-0"
            style={{ background: team.color }}
          />
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">
              {winner ? "Winner" : "Led at the close"}
            </p>
            <p className="font-rs-bold text-2xl text-primary">{team.name}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground sm:text-right">
          {winner
            ? `Reached tile ${team.position}`
            : `No team reached the finish. Led at tile ${team.position}`}
          <br />
          {team.approved} tiles approved &middot; {team.tiles_cleared} tiles cleared
        </p>
      </div>
    </Card>
  );
}

interface Props {
  recap: TileRaceRecap;
}

export function EventRecap({ recap }: Props): JSX.Element {
  const { event, totals, teams } = recap;
  const winner = teams.find((t) => t.id === event.winner_team_id) ?? null;

  return (
    <div className="space-y-6">
      <Outcome winner={winner} leader={teams[0] ?? null} />
      <RecapStats totals={totals} />
      <PositionChart teams={teams} pathLength={event.path_length} />
      <DailySubmissionsChart teams={teams} />
      <StandingsTable teams={teams} />
      <ContributorsTable
        teams={teams}
        removedParticipants={totals.removed_participants}
      />
      <RosterGrid teams={teams} />
    </div>
  );
}
