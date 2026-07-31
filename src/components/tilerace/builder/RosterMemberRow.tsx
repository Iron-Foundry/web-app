import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crown, Swords, UserMinus } from "lucide-react";
import {
  usePatchRosterMember,
  useRemoveRosterMember,
} from "@/hooks/useTilerace";
import type { TileRaceSignup, TileRaceTeam } from "@/types/tilerace";

const UNASSIGNED = "unassigned";

interface Props {
  eventId: string;
  member: TileRaceSignup;
  teams: TileRaceTeam[];
  threshold: number;
}

export function RosterMemberRow({
  eventId,
  member,
  teams,
  threshold,
}: Props): JSX.Element {
  const { mutate: patch, isPending: patching } = usePatchRosterMember();
  const { mutate: remove, isPending: removing } = useRemoveRosterMember();
  const busy = patching || removing;
  const isRaider = member.raids_kc >= threshold;

  function move(value: string): void {
    patch({
      eventId,
      discordUserId: member.discord_user_id,
      data: { team_id: value === UNASSIGNED ? null : Number(value) },
    });
  }

  function toggleCaptain(): void {
    patch({
      eventId,
      discordUserId: member.discord_user_id,
      data: { is_captain: !member.is_captain },
    });
  }

  return (
    <li className="flex items-center gap-1.5 text-xs">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleCaptain}
            disabled={busy || !member.team_id}
            className="shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Crown
              className={
                member.is_captain
                  ? "h-3 w-3 text-amber-500"
                  : "h-3 w-3 text-muted-foreground/30 hover:text-amber-500/70"
              }
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {!member.team_id
            ? "Assign to a team first"
            : member.is_captain
              ? "Remove as captain"
              : "Make captain (replaces the current one)"}
        </TooltipContent>
      </Tooltip>

      <span
        className={`truncate ${member.is_captain ? "font-medium" : "text-muted-foreground"}`}
      >
        {member.rsn}
      </span>

      {member.added_by_staff && (
        <span className="text-[10px] text-muted-foreground/60">(added)</span>
      )}

      {isRaider && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-0.5 text-emerald-500 shrink-0">
              <Swords className="h-3 w-3" />
              <span className="text-[10px]">{member.raids_kc}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>Highest raid KC: {member.raids_kc}</TooltipContent>
        </Tooltip>
      )}

      <span className="text-muted-foreground/50 text-[10px] ml-auto shrink-0">
        {member.ranking_score}
      </span>

      <Select
        value={member.team_id ?? UNASSIGNED}
        onValueChange={move}
        disabled={busy}
      >
        <SelectTrigger className="h-6 w-28 text-[11px] shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
          {teams.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        disabled={busy}
        onClick={() => {
          if (confirm(`Remove ${member.rsn} from this event?`)) {
            remove({ eventId, discordUserId: member.discord_user_id });
          }
        }}
      >
        <UserMinus className="h-3 w-3" />
      </Button>
    </li>
  );
}
