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
  removedParticipants: number;
}

export function ContributorsTable({
  teams,
  removedParticipants,
}: Props): JSX.Element {
  const contributors = buildContributors(teams);

  return (
    <RecapCard
      title="Top contributors"
      description="Approved tiles per participant. Participants removed during the event are excluded."
      action={
        removedParticipants > 0 ? (
          <Badge variant="secondary">
            {removedParticipants} removed{" "}
            {removedParticipants === 1 ? "participant" : "participants"} excluded
          </Badge>
        ) : undefined
      }
    >
      {contributors.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No participants were on a team when this event closed.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead className="text-right">Tiles proven</TableHead>
                <TableHead className="w-32">Share of team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributors.map((participant, index) => (
                <TableRow key={`${participant.team.id}-${participant.rsn}`}>
                  <TableCell
                    className={index === 0 ? "font-bold text-primary" : undefined}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {participant.rsn}
                      {participant.is_captain && (
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
                        style={{ background: participant.team.color }}
                      />
                      {participant.team.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {participant.approved}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {participant.rejected}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {participant.tiles_proven}
                  </TableCell>
                  <TableCell>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${participant.share}%`,
                          background: participant.team.color,
                        }}
                      />
                    </div>
                    <span className="text-[0.65rem] text-muted-foreground">
                      {participant.share}%
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
