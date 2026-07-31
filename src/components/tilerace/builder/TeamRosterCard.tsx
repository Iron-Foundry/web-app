import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Crown, Pencil, Trash2 } from "lucide-react";
import { useDeleteTileraceTeam } from "@/hooks/useTilerace";
import { RosterMemberRow } from "./RosterMemberRow";
import { TeamIdentityDialog } from "./TeamIdentityDialog";
import type { TileRaceSignup, TileRaceTeam } from "@/types/tilerace";

interface Props {
  eventId: string;
  team: TileRaceTeam;
  members: TileRaceSignup[];
  teams: TileRaceTeam[];
  threshold: number;
  showRaidWarning: boolean;
  discordProvisioned: boolean;
}

export function TeamRosterCard({
  eventId,
  team,
  members,
  teams,
  threshold,
  showRaidWarning,
  discordProvisioned,
}: Props): JSX.Element {
  const { mutate: deleteTeam, isPending: deleting } = useDeleteTileraceTeam();
  const [editing, setEditing] = useState(false);
  const avg = members.length
    ? Math.round(
        members.reduce((n, m) => n + m.ranking_score, 0) / members.length,
      )
    : 0;
  const hasRaider = members.some((m) => m.raids_kc >= threshold);
  const hasCaptain = members.some((m) => m.is_captain);

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          {team.icon_url ? (
            <img
              src={team.icon_url}
              alt=""
              className="h-5 w-5 shrink-0 object-contain"
            />
          ) : (
            <div
              className="h-4 w-4 rounded-full shrink-0"
              style={{ backgroundColor: team.color }}
            />
          )}
          <span className="font-medium text-sm flex-1 truncate">{team.name}</span>

          {members.length > 0 && !hasCaptain && (
            <Badge
              variant="outline"
              className="text-[10px] gap-1 border-amber-500/50 text-amber-500"
            >
              <Crown className="h-3 w-3" />
              no captain
            </Badge>
          )}

          {showRaidWarning && !hasRaider && (
            <Badge
              variant="outline"
              className="text-[10px] gap-1 border-amber-500/50 text-amber-500"
            >
              <AlertTriangle className="h-3 w-3" />
              no raider
            </Badge>
          )}

          <Badge variant="outline" className="text-[10px]">
            {members.length} - avg {avg}
          </Badge>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setEditing(true)}
            title="Rename or restyle this team"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={deleting}
            onClick={() => {
              if (
                confirm(
                  `Delete team "${team.name}"? Its members return to the unassigned pool.`,
                )
              ) {
                deleteTeam({ eventId, teamId: team.id });
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {members.length === 0 ? (
          <p className="text-xs text-muted-foreground">Empty.</p>
        ) : (
          <ul className="space-y-1">
            {members.map((m) => (
              <RosterMemberRow
                key={m.discord_user_id}
                eventId={eventId}
                member={m}
                teams={teams}
                threshold={threshold}
              />
            ))}
          </ul>
        )}

        <TeamIdentityDialog
          eventId={eventId}
          team={team}
          open={editing}
          onOpenChange={setEditing}
          discordProvisioned={discordProvisioned}
        />
      </CardContent>
    </Card>
  );
}
