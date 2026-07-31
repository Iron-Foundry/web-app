import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Shuffle, Undo2, Swords } from "lucide-react";
import {
  useGenerateTileraceTeams,
  useResetTileraceTeams,
} from "@/hooks/useTilerace";
import type { TileRaceEvent } from "@/types/tilerace";

interface Props {
  event: TileRaceEvent;
  assignedCount: number;
  threshold: number;
  onThresholdChange: (value: number) => void;
}

export function GenerateTeamsBar({
  event,
  assignedCount,
  threshold,
  onThresholdChange,
}: Props): JSX.Element {
  const [teamSize, setTeamSize] = useState(String(event.team_size || 5));
  const [balanceRaids, setBalanceRaids] = useState(false);
  const { mutate: generate, isPending: generating } = useGenerateTileraceTeams();
  const { mutate: reset, isPending: resetting } = useResetTileraceTeams();

  const size = Number(teamSize) || 0;
  const pool = event.signups.length;
  const teamCount = size > 0 ? Math.ceil(pool / size) : 0;
  const busy = generating || resetting;

  function handleGenerate(): void {
    if (size < 1 || pool === 0) return;
    generate({
      eventId: event.id,
      options: {
        team_size: size,
        balance_raids_kc: balanceRaids,
        raids_kc_threshold: Math.max(1, threshold),
      },
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Team Size</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className="h-8 w-24 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 pb-1.5 cursor-pointer">
            <Checkbox
              checked={balanceRaids}
              onCheckedChange={(v) => setBalanceRaids(v === true)}
            />
            <Swords className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs">Every team gets a raider</span>
          </label>

          {balanceRaids && (
            <div className="space-y-1.5">
              <Label className="text-xs">Min raid KC</Label>
              <Input
                type="number"
                min={1}
                value={threshold}
                onChange={(e) =>
                  onThresholdChange(Math.max(1, Number(e.target.value) || 1))
                }
                className="h-8 w-24 text-sm"
              />
            </div>
          )}

          <div className="flex gap-2 ml-auto pb-0.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm("Unassign everyone and return to bare signups?")) {
                  reset(event.id);
                }
              }}
              disabled={busy || assignedCount === 0}
              className="gap-1.5"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Reset to Signups
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={busy || pool === 0 || size < 1}
              className="gap-1.5"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Generate Teams
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {pool} on the roster
          {teamCount > 0 && (
            <>
              {" "}
              &rarr; {teamCount} {teamCount === 1 ? "team" : "teams"}, none larger
              than {size}
            </>
          )}
          . Generating never deletes anyone; Reset returns every member to the
          unassigned pool.
        </p>
      </CardContent>
    </Card>
  );
}
