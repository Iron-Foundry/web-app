import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import { usePatchTileraceDiscordPermissions } from "@/hooks/useTilerace";
import type {
  TileRaceDiscordPermission,
  TileRaceEvent,
} from "@/types/tilerace";

interface Props {
  event: TileRaceEvent;
}

const TOGGLES: Array<{
  key: TileRaceDiscordPermission;
  label: string;
  hint: string;
}> = [
  {
    key: "pin_messages",
    label: "Pin messages",
    hint: "Pin and unpin in their own channels. Nothing else.",
  },
  {
    key: "manage_messages",
    label: "Delete messages",
    hint: "Delete and bulk-delete anyone's messages in their own channels.",
  },
  {
    key: "mention_everyone",
    label: "Mention everyone and roles",
    hint: "Use @everyone, @here and role mentions inside their channels.",
  },
  {
    key: "manage_threads",
    label: "Threads",
    hint: "Open threads, post in them and manage the ones they own.",
  },
  {
    key: "manage_channel",
    label: "Edit their channels",
    hint: "Rename their own text and voice channel and set the topic.",
  },
  {
    key: "voice_moderation",
    label: "Voice moderation",
    hint: "Mute, deafen and move members inside their own voice channel.",
  },
];

/**
 * Elevated permissions every team holds in its own managed channels.
 *
 * Each toggle only grants: turning one off returns the permission to inherited
 * rather than denying it. A change is pushed onto the channels that already
 * exist, so a live event keeps its channels and their history.
 */
export function DiscordPermissionsCard({ event }: Props): JSX.Element {
  const { mutate, isPending } = usePatchTileraceDiscordPermissions();
  const [pending, setPending] = useState<TileRaceDiscordPermission | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: TileRaceDiscordPermission): void {
    setError(null);
    setPending(key);
    mutate(
      { eventId: event.id, data: { [key]: !event.discord_permissions[key] } },
      {
        onError: (e: Error) => setError(e.message),
        onSettled: () => setPending(null),
      },
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold flex-1">Channel Permissions</p>
        </div>
        <p className="text-xs text-muted-foreground">
          What every team's role may do inside its own text and voice channel.
          Captains get the same in the captains channel. Changes are applied to
          the channels that already exist - nothing is torn down and no history
          is lost.
        </p>

        {!event.discord_provisioned && (
          <p className="text-xs text-amber-500">
            Not set up yet - these are saved now and applied when the channels
            are created.
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {TOGGLES.map(({ key, label, hint }) => {
            const on = event.discord_permissions[key];
            return (
              <div key={key} className="flex items-start gap-2">
                <Button
                  size="sm"
                  variant={on ? "default" : "outline"}
                  disabled={isPending}
                  onClick={() => toggle(key)}
                  className="w-32 shrink-0 justify-start gap-1.5"
                >
                  {pending === key && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {label}
                </Button>
                <p className="text-[11px] text-muted-foreground pt-1.5">{hint}</p>
              </div>
            );
          })}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
