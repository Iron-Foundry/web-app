import { useState } from "react";
import { Check, Globe, ListPlus, Lock, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeletePlaylist, useUpdatePlaylist } from "@/hooks/useMusicLibrary";
import { PlaylistTracks } from "./PlaylistTracks";
import type { MusicCommand, Playlist } from "@/types/music";

interface PlaylistRowProps {
  playlist: Playlist;
  /** Whether the viewer owns it, and so may rename, share, edit or delete it. */
  mine: boolean;
  /** Whether there is a session this viewer may queue into. */
  canQueue: boolean;
  onQueue: (command: MusicCommand) => void;
}

export function PlaylistRow({
  playlist,
  mine,
  canQueue,
  onQueue,
}: PlaylistRowProps): React.ReactElement {
  const update = useUpdatePlaylist();
  const remove = useDeletePlaylist();
  const [expanded, setExpanded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(playlist.name);

  // Nothing restores a deleted playlist, and the button sits next to the ones
  // that only rename or share it.
  const destroy = (): void => {
    if (!confirm(`Delete playlist "${playlist.name}"? This cannot be undone.`)) {
      return;
    }
    remove.mutate(playlist.id);
  };

  const rename = (): void => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== playlist.name) {
      update.mutate({ id: playlist.id, name: trimmed });
    }
    setRenaming(false);
  };

  return (
    <li className="rounded-md border border-border">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {renaming ? (
          <>
            <Input
              className="h-8 max-w-xs flex-1"
              value={name}
              autoFocus
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") rename();
                if (event.key === "Escape") {
                  setName(playlist.name);
                  setRenaming(false);
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Save name"
              onClick={rename}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Cancel rename"
              onClick={() => {
                setName(playlist.name);
                setRenaming(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left text-sm hover:text-primary"
              onClick={() => setExpanded(!expanded)}
            >
              {playlist.name}
              <span className="ml-2 text-xs text-muted-foreground">
                {playlist.track_count} track
                {playlist.track_count === 1 ? "" : "s"}
                {!mine && " · shared"}
              </span>
            </button>
            {mine && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                aria-label={`Rename ${playlist.name}`}
                onClick={() => setRenaming(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={!mine || update.isPending}
              aria-label={playlist.is_public ? "Make private" : "Make public"}
              onClick={() =>
                update.mutate({
                  id: playlist.id,
                  is_public: !playlist.is_public,
                })
              }
            >
              {playlist.is_public ? (
                <Globe className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!canQueue}
              onClick={() =>
                onQueue({ action: "load_playlist", playlist_id: playlist.id })
              }
            >
              <ListPlus className="h-3.5 w-3.5" />
              Queue
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={!mine || remove.isPending}
              aria-label={`Delete ${playlist.name}`}
              onClick={destroy}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
      {expanded && (
        <PlaylistTracks
          playlistId={playlist.id}
          editable={mine}
          canQueue={canQueue}
          onQueue={onQueue}
        />
      )}
    </li>
  );
}
