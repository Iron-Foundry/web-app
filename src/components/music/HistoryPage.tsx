import { useState } from "react";
import { ListPlus, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMusic } from "@/context/MusicContext";
import {
  useMayControl,
  useMusicHistory,
  useSendMusicCommand,
} from "@/hooks/useMusic";
import { AddToPlaylistDialog } from "./AddToPlaylistDialog";
import { duration, toTrackInput } from "./format";
import { NoSession } from "./NoSession";
import { SessionSwitcher } from "./SessionSwitcher";
import type { TrackInput } from "@/types/music";

/**
 * Everything this session has already played, newest first.
 *
 * The Discord panel shows the last ten because that is what fits in two rows of
 * buttons; here the whole kept list is shown. Queueing a track again needs the
 * voice channel, saving one to a playlist does not.
 */
export function HistoryPage(): React.ReactElement {
  const { session, channelId } = useMusic();
  const { data: control } = useMayControl(channelId);
  const { data: entries, isLoading } = useMusicHistory(
    channelId,
    session !== null,
  );
  const command = useSendMusicCommand(channelId);
  const [saving, setSaving] = useState<TrackInput | null>(null);

  if (!session) return <NoSession />;

  const mayControl = control?.may_control ?? false;
  const rows = entries ?? [];

  return (
    <div className="space-y-6">
      <SessionSwitcher />

      <Card className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-rs-bold text-primary">Recently played</p>
          <p className="text-xs text-muted-foreground">
            {rows.length} track{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Kept only while the session is alive. Saving a track to a playlist
          keeps it for good.
        </p>
        <Separator className="my-4" />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing has finished playing yet.
          </p>
        ) : (
          <ol className="space-y-1">
            {rows.map((entry, index) => (
              <li
                key={`${entry.at}-${entry.track.identifier}-${index}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <time
                  className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground"
                  dateTime={entry.at}
                >
                  {new Date(entry.at).toLocaleTimeString()}
                </time>
                <span className="min-w-0 flex-1 truncate">
                  {entry.track.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {entry.track.author}
                  </span>
                </span>
                {entry.event === "skipped" && (
                  <SkipForward
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-label="Skipped"
                  />
                )}
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {duration(entry.track.length_ms)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  disabled={!mayControl || command.isPending}
                  aria-label={`Queue ${entry.track.title} again`}
                  onClick={() =>
                    command.mutate({ action: "add", tracks: [toTrackInput(entry)] })
                  }
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  aria-label={`Add ${entry.track.title} to a playlist`}
                  onClick={() => setSaving(toTrackInput(entry))}
                >
                  <ListPlus className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ol>
        )}

        {!mayControl && rows.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Join {session.channel_name ?? "the voice channel"} to queue any of
            these again. Saving to a playlist works either way.
          </p>
        )}
      </Card>

      <AddToPlaylistDialog
        track={saving}
        onOpenChange={(open) => !open && setSaving(null)}
      />
    </div>
  );
}
