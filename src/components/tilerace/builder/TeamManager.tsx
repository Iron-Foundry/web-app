import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Plus, Lock, LockOpen } from "lucide-react";
import { TEAM_COLORS } from "@/lib/tilerace";
import { useAddTileraceTeam, usePatchTileraceEvent } from "@/hooks/useTilerace";
import { GenerateTeamsBar } from "./GenerateTeamsBar";
import { TeamRosterCard } from "./TeamRosterCard";
import { RosterMemberRow } from "./RosterMemberRow";
import { AddRosterMember } from "./AddRosterMember";
import type { TileRaceEvent } from "@/types/tilerace";

interface TeamManagerProps {
  event: TileRaceEvent;
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

  function handleSubmit(): void {
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
  const [threshold, setThreshold] = useState(1);
  const { mutate: patchEvent, isPending: patching } = usePatchTileraceEvent();

  const { byTeam, unassigned } = useMemo(() => {
    const grouped = new Map<string, typeof event.signups>();
    const pool: typeof event.signups = [];
    for (const s of event.signups) {
      if (s.team_id) {
        const list = grouped.get(s.team_id) ?? [];
        list.push(s);
        grouped.set(s.team_id, list);
      } else {
        pool.push(s);
      }
    }
    for (const list of grouped.values()) {
      list.sort(
        (a, b) =>
          Number(b.is_captain) - Number(a.is_captain) ||
          b.ranking_score - a.ranking_score,
      );
    }
    pool.sort((a, b) => b.ranking_score - a.ranking_score);
    return { byTeam: grouped, unassigned: pool };
  }, [event.signups]);

  const assignedCount = event.signups.length - unassigned.length;
  const showRaidWarning = assignedCount > 0;

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Teams</p>
          <p className="text-xs text-muted-foreground">
            {event.signups.length} on the roster, {assignedCount} assigned,{" "}
            {unassigned.length} unassigned
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
          <Button size="sm" onClick={() => setAdding(true)} disabled={adding} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Team
          </Button>
        </div>
      </div>

      <GenerateTeamsBar
        event={event}
        assignedCount={assignedCount}
        threshold={threshold}
        onThresholdChange={setThreshold}
      />

      {adding && (
        <AddTeamForm
          eventId={event.id}
          teamCount={event.teams.length}
          onDone={() => setAdding(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,18rem)_1fr] gap-4 items-start">
        <Card>
          <CardContent className="p-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Unassigned ({unassigned.length})
            </p>
            <AddRosterMember eventId={event.id} />
            <Separator />
            {unassigned.length === 0 ? (
              <p className="text-xs text-muted-foreground">Everyone is on a team.</p>
            ) : (
              <ul className="space-y-1">
                {unassigned.map((m) => (
                  <RosterMemberRow
                    key={m.discord_user_id}
                    eventId={event.id}
                    member={m}
                    teams={event.teams}
                    threshold={threshold}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {event.teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No teams yet. Set a team size and hit Generate Teams.
            </p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {event.teams.map((team) => (
                <TeamRosterCard
                  key={team.id}
                  eventId={event.id}
                  team={team}
                  members={byTeam.get(team.id) ?? []}
                  teams={event.teams}
                  threshold={threshold}
                  showRaidWarning={showRaidWarning}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
