import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecapCard } from "./RecapCard";
import { approvalRate } from "@/lib/tilerace-recap";
import type { TileRaceRecapTeam } from "@/types/tilerace";

interface Props {
  teams: TileRaceRecapTeam[];
}

export function StandingsTable({ teams }: Props): JSX.Element {
  return (
    <RecapCard
      title="Final standings"
      description="Ordered by the tile each team finished on, then by tiles cleared."
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Final tile</TableHead>
              <TableHead className="text-right">Furthest</TableHead>
              <TableHead className="text-right">Tiles cleared</TableHead>
              <TableHead className="text-right">Approved</TableHead>
              <TableHead className="text-right">Rejected</TableHead>
              <TableHead className="w-28">Approval</TableHead>
              <TableHead className="text-right">Rolls</TableHead>
              <TableHead className="text-right">Racers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team, index) => {
              const rate = approvalRate(team);
              return (
                <TableRow key={team.id}>
                  <TableCell
                    className={index === 0 ? "font-bold text-primary" : undefined}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <span
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ background: team.color }}
                      />
                      {team.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {team.position}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {team.furthest_position}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {team.tiles_cleared}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {team.approved}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {team.rejected}
                  </TableCell>
                  <TableCell>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${rate}%`, background: team.color }}
                      />
                    </div>
                    <span className="text-[0.65rem] text-muted-foreground">{rate}%</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{team.rolls}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {team.roster.length}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </RecapCard>
  );
}
