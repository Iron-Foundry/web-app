import { useState } from "react";
import { GripVertical, ListPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAppendPlaylistTracks,
  useMusicPlaylist,
  useReplacePlaylistTracks,
} from "@/hooks/useMusicLibrary";
import { duration } from "./format";
import { TrackSearch } from "./TrackSearch";
import { cn } from "@/lib/utils";
import type { MusicCommand, TrackInput } from "@/types/music";

interface PlaylistTracksProps {
  playlistId: number;
  /** Whether the viewer owns it, and so may reorder and remove. */
  editable: boolean;
  /** Whether there is a session this viewer may queue into. */
  canQueue: boolean;
  onQueue: (command: MusicCommand) => void;
}

/**
 * The saved rows of one playlist, loaded only once it is opened.
 *
 * Editing a playlist has nothing to do with playback, so the owner can reorder
 * and remove here whether or not a bot is in a voice channel. Each edit rewrites
 * the whole list, which is what the API takes.
 *
 * Queueing a single track is the one control here that does need a session, and
 * it is not the owner's alone: a shared playlist can be queued whole by anyone
 * who can see it, so one track out of it is no different.
 */
export function PlaylistTracks({
  playlistId,
  editable,
  canQueue,
  onQueue,
}: PlaylistTracksProps): React.ReactElement {
  const { data, isLoading } = useMusicPlaylist(playlistId);
  const replace = useReplacePlaylistTracks(playlistId);
  const append = useAppendPlaylistTracks(playlistId);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <p className="px-3 pb-3 text-xs text-muted-foreground">
        Loading tracks...
      </p>
    );
  }

  const search = editable ? (
    <div className="border-t border-border px-3 py-3">
      <TrackSearch
        onAdd={(tracks) => append.mutate(tracks)}
        pending={append.isPending}
      />
    </div>
  ) : null;

  if (!data || data.tracks.length === 0) {
    return (
      <>
        <p className="px-3 pb-3 text-xs text-muted-foreground">
          {editable
            ? "No tracks yet. Search below, or save a queue from the Queue page."
            : "No tracks saved."}
        </p>
        {search}
      </>
    );
  }

  const rows: TrackInput[] = data.tracks.map((track) => ({
    source: track.source,
    identifier: track.identifier,
    title: track.title,
    author: track.author,
    duration_ms: track.duration_ms,
    isrc: track.isrc,
    uri: track.uri,
    // Carried through every reorder and removal: these rows are written back
    // whole, so a field dropped here is dropped from the saved playlist.
    artwork: track.artwork,
  }));

  const move = (from: number, to: number): void => {
    if (from === to) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    replace.mutate(next);
  };

  const remove = (index: number): void => {
    const row = data.tracks[index];
    if (!row) return;
    if (!confirm(`Remove "${row.title}" from this playlist?`)) return;
    replace.mutate(rows.filter((_, at) => at !== index));
  };

  // The saved row travels as it is, the same shape a search result is queued
  // in, so the bot queues exactly the track that was saved rather than
  // searching the title again and finding something else.
  const queue = (index: number): void => {
    const row = rows[index];
    if (row) onQueue({ action: "add", tracks: [row] });
  };

  return (
    <>
      <ol className="space-y-1 border-t border-border px-3 py-2">
        {data.tracks.map((track, index) => (
          <li
            key={`${track.position}-${track.identifier}`}
            draggable={editable}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => {
              event.preventDefault();
              setOverIndex(index);
            }}
            onDrop={() => {
              if (dragIndex !== null) move(dragIndex, index);
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-md px-1 py-1 text-xs",
              editable && "cursor-grab active:cursor-grabbing",
              overIndex === index && dragIndex !== null && "bg-muted",
            )}
          >
            {editable && (
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="w-5 shrink-0 text-right tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {track.title}
              <span className="ml-2 text-muted-foreground">{track.author}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {duration(track.duration_ms)}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0"
              disabled={!canQueue}
              aria-label={`Add ${track.title} to the queue`}
              onClick={() => queue(index)}
            >
              <ListPlus className="h-3 w-3" />
            </Button>
            {editable && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                disabled={replace.isPending}
                aria-label={`Remove ${track.title}`}
                onClick={() => remove(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </li>
        ))}
      </ol>
      {search}
    </>
  );
}
