import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecapCard } from "./RecapCard";
import { buildContributors } from "@/lib/tilerace-recap";
import type { TileRaceRecapTeam } from "@/types/tilerace";

interface Props {
  teams: TileRaceRecapTeam[];
  removedRacers: number;
}

export function ContributorsTable({ teams, removedRacers }: Props): JSX.Element {
  const contributors = buildContributors(teams);

  return (
    <RecapCard
      title="Top contributors"
      description="Approved proofs per racer. Racers removed during the event are excluded."
      action={
        removedRacers > 0 ? (
          <Badge variant="secondary">
            {removedRacers} removed {removedRacers === 1 ? "racer" : "racers"} excluded
          </Badge>
        ) : undefined
      }
    >
      {contributors.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No racers were on a team when this event closed.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Racer</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead className="text-right">Tiles proved</TableHead>
                <TableHead className="w-32">Share of team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributors.map((racer, index) => (
                <TableRow key={`${racer.team.id}-${racer.rsn}`}>
                  <TableCell
                    className={index === 0 ? "font-bold text-primary" : undefined}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {racer.rsn}
                      {racer.is_captain && (
                        <Badge variant="outline" className="text-[0.6rem]">
                          captain
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ background: racer.team.color }}
                      />
                      {racer.team.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {racer.approved}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {racer.rejected}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {racer.tiles_proved}
                  </TableCell>
                  <TableCell>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${racer.share}%`, background: racer.team.color }}
                      />
                    </div>
                    <span className="text-[0.65rem] text-muted-foreground">
                      {racer.share}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </RecapCard>
  );
}
