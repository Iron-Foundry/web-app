import { Card, CardContent } from "@/components/ui/card";
import { Dice6, SkipForward } from "lucide-react";
import { timeAgo } from "@/components/members/feedHelpers";
import type { TileRacePublicTeam, TileRaceRoll } from "@/types/tilerace";

interface RecentRollsPanelProps {
  rolls: TileRaceRoll[];
  teams: TileRacePublicTeam[];
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
                    className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center overflow-hidden border"
                    style={{
                      borderColor: team?.color ?? "#888888",
                      backgroundColor: (team?.color ?? "#888888") + "20",
                    }}
                  >
                    {team?.icon_url ? (
                      <img
                        src={team.icon_url}
                        alt={team.name}
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <span
                        className="text-[10px] font-bold leading-none"
                        style={{ color: team?.color ?? "#888888" }}
                      >
                        {(team?.name ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
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
                        <Dice6 className="h-3 w-3 text-primary" />
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
