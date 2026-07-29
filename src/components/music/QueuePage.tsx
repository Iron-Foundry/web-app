import { useState } from "react";
import { GripVertical, Play, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useMusic } from "@/context/MusicContext";
import {
  useMayControl,
  useMusicQueue,
  useSendMusicCommand,
} from "@/hooks/useMusic";
import { useCreatePlaylistWithTracks } from "@/hooks/useMusicLibrary";
import { duration } from "./format";
import { NoSession } from "./NoSession";
import { SessionSwitcher } from "./SessionSwitcher";
import { TrackArt } from "./TrackArt";
import { TrackSearch } from "./TrackSearch";
import { cn } from "@/lib/utils";

export function QueuePage(): React.ReactElement {
  const { session, channelId } = useMusic();
  const { data: control } = useMayControl(channelId);
  const { data: queue } = useMusicQueue(channelId);
  const command = useSendMusicCommand(channelId);
  const savePlaylist = useCreatePlaylistWithTracks();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [playlistName, setPlaylistName] = useState("");

  if (!session) return <NoSession />;

  const mayControl = control?.may_control ?? false;
  const tracks = queue ?? [];

  const drop = (destination: number): void => {
    if (dragIndex !== null && dragIndex !== destination) {
      command.mutate({ action: "move", index: dragIndex, destination });
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const save = (): void => {
    if (!playlistName.trim() || tracks.length === 0) return;
    savePlaylist.mutate(
      {
        name: playlistName.trim(),
        is_public: false,
        tracks: tracks.map((row) => ({
          source: row.source,
          identifier: row.identifier,
          title: row.title,
          author: row.author,
          duration_ms: row.length_ms,
          isrc: row.isrc,
          uri: row.uri,
          artwork: row.artwork,
        })),
      },
      { onSuccess: () => setPlaylistName("") },
    );
  };

  return (
    <div className="space-y-6">
      <SessionSwitcher />

      <Card className="p-6">
        <p className="font-rs-bold text-primary">Add to the queue</p>
        <Separator className="my-4" />
        <TrackSearch
          onAdd={(tracks) => command.mutate({ action: "add", tracks })}
          pending={command.isPending}
          disabledReason={
            mayControl
              ? null
              : `Join ${session.channel_name ?? "the voice channel"} to add tracks.`
          }
        />
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-rs-bold text-primary">Queue</p>
          <p className="text-xs text-muted-foreground">
            {tracks.length} track{tracks.length === 1 ? "" : "s"} ·{" "}
            {duration(session.remaining_ms)} remaining
          </p>
        </div>
        <Separator className="my-4" />

        {tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing queued.</p>
        ) : (
          <ol className="space-y-1">
            {tracks.map((row, index) => (
              <li
                key={`${row.identifier}-${index}`}
                draggable={mayControl}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverIndex(index);
                }}
                onDrop={() => drop(index)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  mayControl && "cursor-grab active:cursor-grabbing",
                  overIndex === index && dragIndex !== null && "bg-muted",
                )}
              >
                {mayControl && (
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <TrackArt url={row.artwork} className="h-9 w-9" />
                <span className="min-w-0 flex-1 truncate">
                  {row.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {row.author}
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {duration(row.length_ms)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  disabled={!mayControl}
                  aria-label={`Play ${row.title} now`}
                  onClick={() => command.mutate({ action: "jump", index })}
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  disabled={!mayControl}
                  aria-label={`Remove ${row.title}`}
                  onClick={() => command.mutate({ action: "remove", index })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="p-6">
        <p className="font-rs-bold text-primary">Save this queue</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Keeps the tracks, not the audio, so a dead link re-resolves when it
          plays.
        </p>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            placeholder="Playlist name"
            value={playlistName}
            onChange={(event) => setPlaylistName(event.target.value)}
          />
          <Button
            onClick={save}
            disabled={
              savePlaylist.isPending ||
              tracks.length === 0 ||
              !playlistName.trim()
            }
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
