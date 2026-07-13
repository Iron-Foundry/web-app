import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Shuffle, Crown, Lock, LockOpen } from "lucide-react";
import { TEAM_COLORS } from "@/lib/tilerace";
import {
  useAddTileraceTeam,
  useDeleteTileraceTeam,
  useScrambleTileraceTeams,
  usePatchTileraceEvent,
} from "@/hooks/useTilerace";
import type { TileRaceEvent, TileRaceTeam } from "@/types/tilerace";

interface TeamManagerProps {
  event: TileRaceEvent;
}

function TeamRow({
  team,
  eventId,
  signupCount,
}: {
  team: TileRaceTeam;
  eventId: string;
  signupCount: number;
}): JSX.Element {
  const { mutate: deleteTeam, isPending: deleting } = useDeleteTileraceTeam();

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full shrink-0"
            style={{ backgroundColor: team.color }}
          />
          <span className="font-medium text-sm flex-1 truncate">{team.name}</span>
          <Badge variant="outline" className="text-xs">{team.members.length} members</Badge>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={deleting}
            onClick={() => {
              if (confirm(`Delete team "${team.name}"?`)) {
                deleteTeam({ eventId, teamId: team.id });
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {team.members.length > 0 && (
          <ul className="space-y-1">
            {team.members.map((m) => (
              <li key={m.discord_user_id} className="flex items-center gap-1.5 text-xs">
                {m.is_captain && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                <span className={m.is_captain ? "font-medium" : "text-muted-foreground"}>
                  {m.rsn}
                </span>
                <span className="text-muted-foreground/50 text-[10px] ml-auto">
                  score: {m.ranking_score}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AddTeamForm({
  eventId,
  teamCount,
  onDone,
}: {
  eventId: string;
  teamCount: number;
  onDone: () => void;
}): JSX.Element {
  const [name, setName] = useState("");
  const { mutate: addTeam, isPending } = useAddTileraceTeam();

  function handleSubmit() {
    if (!name.trim()) return;
    const color = TEAM_COLORS[teamCount % TEAM_COLORS.length] ?? "#888";
    addTeam(
      {
        eventId,
        data: {
          name: name.trim(),
          slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          icon_type: "item",
          icon_url: "",
          color,
        },
      },
      { onSuccess: onDone },
    );
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 space-y-1.5">
        <Label className="text-xs">Team Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team name"
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>
      <Button size="sm" onClick={handleSubmit} disabled={isPending || !name.trim()}>
        Add
      </Button>
      <Button size="sm" variant="ghost" onClick={onDone}>
        Cancel
      </Button>
    </div>
  );
}

export function TeamManager({ event }: TeamManagerProps): JSX.Element {
  const [adding, setAdding] = useState(false);
  const { mutate: scramble, isPending: scrambling } = useScrambleTileraceTeams();
  const { mutate: patchEvent, isPending: patching } = usePatchTileraceEvent();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Teams</p>
          <p className="text-xs text-muted-foreground">
            {event.signups.length} signed up, {event.teams.reduce((n, t) => n + t.members.length, 0)} assigned
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              patchEvent({ id: event.id, data: { signups_open: !event.signups_open } })
            }
            disabled={patching}
            className="gap-1.5"
          >
            {event.signups_open ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                Close Signups
              </>
            ) : (
              <>
                <LockOpen className="h-3.5 w-3.5" />
                Open Signups
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => scramble(event.id)}
            disabled={scrambling || event.signups.length === 0 || event.teams.length === 0}
            className="gap-1.5"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Scramble
          </Button>
          <Button size="sm" onClick={() => setAdding(true)} disabled={adding} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Team
          </Button>
        </div>
      </div>

      {adding && (
        <AddTeamForm
          eventId={event.id}
          teamCount={event.teams.length}
          onDone={() => setAdding(false)}
        />
      )}

      {event.teams.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">No teams yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {event.teams.map((team) => (
          <TeamRow
            key={team.id}
            team={team}
            eventId={event.id}
            signupCount={event.signups.length}
          />
        ))}
      </div>

      {event.signups.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Unassigned Signups
          </p>
          <div className="flex flex-wrap gap-1.5">
            {event.signups.map((s) => (
              <Badge
                key={s.discord_user_id}
                variant="outline"
                className="text-xs gap-1"
              >
                {s.wants_captain && <Crown className="h-3 w-3 text-amber-500" />}
                {s.rsn}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
