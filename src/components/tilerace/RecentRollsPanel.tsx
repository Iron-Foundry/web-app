import { Card, CardContent } from "@/components/ui/card";
import { Dice6, SkipForward } from "lucide-react";
import { timeAgo } from "@/components/members/feedHelpers";
import type { TileRaceRoll, TileRaceTeam } from "@/types/tilerace";

interface RecentRollsPanelProps {
  rolls: TileRaceRoll[];
  teams: TileRaceTeam[];
}

export function RecentRollsPanel({ rolls, teams }: RecentRollsPanelProps): JSX.Element {
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="font-rs-bold text-sm text-primary uppercase tracking-wide">
          Recent Rolls
        </p>
        {rolls.length === 0 ? (
          <p className="text-xs text-muted-foreground">No rolls yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rolls.map((roll) => {
              const team = teamsById.get(roll.team_id);
              return (
                <li key={roll.id} className="flex items-center gap-2.5 py-2 text-sm">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 border border-white/50"
                    style={{ backgroundColor: team?.color ?? "#888888" }}
                  />
                  <span className="font-medium truncate">
                    {team?.name ?? "Unknown team"}
                  </span>
                  <span className="flex-1 min-w-0 text-muted-foreground truncate">
                    {roll.skipped ? (
                      <span className="inline-flex items-center gap-1">
                        <SkipForward className="h-3 w-3" />
                        skipped a turn
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Dice6 className="h-3 w-3" />
                        rolled {roll.dice.join(" + ")}
                        {roll.dice.length > 1 ? ` = ${roll.roll}` : ""}
                        {" → step "}
                        {roll.new_position}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {timeAgo(roll.rolled_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
