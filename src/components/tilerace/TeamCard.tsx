import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Crown, Dice6 } from "lucide-react";
import type { BoardCell, RepositoryTile, TileRaceTeam } from "@/types/tilerace";
import { getEffectiveTileIcon } from "@/lib/tilerace";

interface TeamCardProps {
  team: TileRaceTeam;
  currentCell: BoardCell | undefined;
  isRolling?: boolean;
  children?: React.ReactNode;
}

export function TeamCard({
  team,
  currentCell,
  isRolling = false,
  children,
}: TeamCardProps): JSX.Element {
  const [membersExpanded, setMembersExpanded] = useState(false);
  const tile = currentCell?.tile ?? null;
  const tileIcon = tile ? getEffectiveTileIcon(tile) : null;

  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: team.color }} />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center overflow-hidden border-2"
            style={{ borderColor: team.color, backgroundColor: team.color + "20" }}
          >
            {team.icon_url ? (
              <img src={team.icon_url} alt={team.name} className="h-8 w-8 object-contain" />
            ) : (
              <span className="font-bold text-sm" style={{ color: team.color }}>
                {team.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{team.name}</p>
            <p className="text-xs text-muted-foreground">Step {team.position}</p>
          </div>
          {isRolling && (
            <Badge variant="outline" className="gap-1 shrink-0 animate-pulse">
              <Dice6 className="h-3 w-3 animate-spin" />
              Rolling
            </Badge>
          )}
          {tile && tileIcon && (
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
              <img src={tileIcon} alt={tile.title} className="h-7 w-7 object-contain" />
            </div>
          )}
        </div>

        {tile && (
          <p className="text-xs text-muted-foreground truncate">
            Current: <span className="text-foreground font-medium">{tile.title}</span>
          </p>
        )}

        <button
          onClick={() => setMembersExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {membersExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {team.members.length} member{team.members.length !== 1 ? "s" : ""}
        </button>

        {membersExpanded && (
          <ul className="space-y-1">
            {team.members.map((m) => (
              <li key={m.discord_user_id} className="flex items-center gap-1.5 text-xs">
                {m.is_captain && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                <span className={m.is_captain ? "font-medium" : "text-muted-foreground"}>
                  {m.rsn}
                </span>
              </li>
            ))}
          </ul>
        )}

        {children}
      </CardContent>
    </Card>
  );
}
