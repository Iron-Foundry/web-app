import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import {
  useAppendTracksTo,
  useCreatePlaylistWithTracks,
  useMusicPlaylists,
} from "@/hooks/useMusicLibrary";
import type { TrackInput } from "@/types/music";

interface AddToPlaylistDialogProps {
  /** The track to save, or null while the dialog is closed. */
  track: TrackInput | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Save one track into a playlist.
 *
 * Only the viewer's own playlists are offered: a public playlist can be read
 * and queued by anyone, but only its owner may change it, so listing shared
 * ones here would offer a button the API is going to refuse.
 *
 * Needs no voice channel. Saving a track is library work.
 */
export function AddToPlaylistDialog({
  track,
  onOpenChange,
}: AddToPlaylistDialogProps): React.ReactElement {
  const { user } = useAuth();
  const { data: playlists } = useMusicPlaylists(track !== null);
  const append = useAppendTracksTo();
  const create = useCreatePlaylistWithTracks();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  const mine = (playlists ?? []).filter(
    (playlist) => playlist.owner_discord_id === user?.discord_user_id,
  );
  const pending = append.isPending || create.isPending;

  const close = (): void => {
    setSaved(null);
    setName("");
    onOpenChange(false);
  };

  const addTo = (playlistId: number, playlistName: string): void => {
    if (!track) return;
    append.mutate(
      { playlistId, tracks: [track] },
      { onSuccess: () => setSaved(`Saved to ${playlistName}.`) },
    );
  };

  const addToNew = (): void => {
    if (!track || !name.trim()) return;
    create.mutate(
      { name: name.trim(), is_public: false, tracks: [track] },
      {
        onSuccess: (playlist) => {
          setName("");
          setSaved(`Saved to ${playlist.name}.`);
        },
      },
    );
  };

  return (
    <Dialog open={track !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to a playlist</DialogTitle>
          <DialogDescription className="truncate">
            {track ? `${track.title} - ${track.author}` : ""}
          </DialogDescription>
        </DialogHeader>

        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have no playlists yet. Name one below and it will be created
            with this track in it.
          </p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {mine.map((playlist) => (
              <li key={playlist.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => addTo(playlist.id, playlist.name)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <span className="min-w-0 truncate">{playlist.name}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                    {playlist.track_count} track
                    {playlist.track_count === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Input
            className="min-w-[10rem] flex-1"
            placeholder="New playlist name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addToNew();
            }}
          />
          <Button onClick={addToNew} disabled={pending || !name.trim()}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>

        {(append.error || create.error) && (
          <p className="text-xs text-destructive">
            That did not save. Try again.
          </p>
        )}
        {saved && <p className="text-xs text-muted-foreground">{saved}</p>}
      </DialogContent>
    </Dialog>
  );
}
