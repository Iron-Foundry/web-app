import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash, Loader2, Trash2 } from "lucide-react";
import {
  useSetupTileraceDiscord,
  useSyncTileraceDiscord,
  useTeardownTileraceDiscord,
} from "@/hooks/useTilerace";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { TileRaceEvent } from "@/types/tilerace";

const POLL_MS = 2000;
const MAX_POLLS = 15;

interface Props {
  event: TileRaceEvent;
}

/**
 * Create and tear down the event's Discord category, roles and channels.
 *
 * The endpoints only queue the work - discord-server does it and reports back -
 * so after a click the event is re-read on a timer until the provisioned flag
 * flips or the attempts run out.
 */
export function DiscordCard({ event }: Props): JSX.Element {
  const qc = useQueryClient();
  const { mutate: setup, isPending: settingUp } = useSetupTileraceDiscord();
  const { mutate: sync, isPending: syncing } = useSyncTileraceDiscord();
  const { mutate: teardown, isPending: tearingDown } = useTeardownTileraceDiscord();
  const [waitingFor, setWaitingFor] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (waitingFor !== null && event.discord_provisioned === waitingFor) {
      setWaitingFor(null);
    }
  }, [event.discord_provisioned, waitingFor]);

  function pollUntilSettled(expected: boolean, attempt = 0): void {
    if (attempt >= MAX_POLLS) {
      setWaitingFor(null);
      setError("The bot has not reported back yet. Check that discord-server is up.");
      return;
    }
    timerRef.current = setTimeout(() => {
      qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(event.id) });
      pollUntilSettled(expected, attempt + 1);
    }, POLL_MS);
  }

  function run(
    mutate: (id: string, opts: { onError: (e: Error) => void }) => void,
    expected: boolean | null,
  ): void {
    setError(null);
    mutate(event.id, {
      onError: (e: Error) => setError(e.message),
    });
    if (expected !== null) {
      setWaitingFor(expected);
      pollUntilSettled(expected);
    }
  }

  const busy = settingUp || syncing || tearingDown || waitingFor !== null;
  const teamCount = event.teams.length;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold flex-1">Discord Channels</p>
          <Badge variant={event.discord_provisioned ? "default" : "outline"}>
            {event.discord_provisioned ? "Set up" : "Not set up"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          One category for the event holding a captains channel plus a text and
          voice channel per team, each locked to that team's own role. Members
          are given their team role, captains the captains role. Renaming a team
          on the Teams tab updates its role and channels straight away.
        </p>

        {!event.discord_provisioned && teamCount === 0 && (
          <p className="text-xs text-amber-500">
            Generate teams first - there is nothing to build channels for.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {event.discord_provisioned ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => run(sync, null)}
                className="gap-1.5"
              >
                <Hash className="h-3.5 w-3.5" />
                Re-sync
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  if (
                    confirm(
                      "Delete the tile race category, every team channel and every team role? Rosters on the site are untouched.",
                    )
                  ) {
                    run(teardown, false);
                  }
                }}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Tear Down
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              disabled={busy || teamCount === 0}
              onClick={() => run(setup, true)}
              className="gap-1.5"
            >
              <Hash className="h-3.5 w-3.5" />
              Create Channels
            </Button>
          )}
          {waitingFor !== null && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Waiting for the bot...
            </span>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
