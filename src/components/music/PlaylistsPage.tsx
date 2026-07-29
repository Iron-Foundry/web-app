import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useMusic } from "@/context/MusicContext";
import { useMayControl, useSendMusicCommand } from "@/hooks/useMusic";
import { useCreatePlaylist, useMusicPlaylists } from "@/hooks/useMusicLibrary";
import { PlaylistImport } from "./PlaylistImport";
import { PlaylistRow } from "./PlaylistRow";

/**
 * Managing saved playlists.
 *
 * The only thing on this page that needs a live session is the Queue button.
 * Creating, renaming, sharing, reordering and deleting are all library work, so
 * they stay available whether or not a bot is in a voice channel.
 */
export function PlaylistsPage(): React.ReactElement {
  const { user } = useAuth();
  const { session, channelId } = useMusic();
  const { data: playlists, isLoading } = useMusicPlaylists(true);
  const { data: control } = useMayControl(channelId);
  const command = useSendMusicCommand(channelId);
  const create = useCreatePlaylist();
  const [name, setName] = useState("");

  const canQueue =
    session !== null && (control?.may_control ?? false) && !command.isPending;
  const rows = playlists ?? [];

  return (
    <div className="space-y-6">
      <PlaylistImport />

      <Card className="p-6">
        <p className="font-rs-bold text-primary">New playlist</p>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            placeholder="Playlist name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && name.trim()) {
                create.mutate(
                  { name: name.trim(), is_public: false },
                  { onSuccess: () => setName("") },
                );
              }
            }}
          />
          <Button
            disabled={create.isPending || !name.trim()}
            onClick={() =>
              create.mutate(
                { name: name.trim(), is_public: false },
                { onSuccess: () => setName("") },
              )
            }
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Fill it by saving a queue from the Queue page, then reorder it here.
        </p>
      </Card>

      <Card className="p-6">
        <p className="font-rs-bold text-primary">Playlists</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Open one to reorder or remove its tracks. Editing never needs a voice
          channel; only queueing does.
        </p>
        <Separator className="my-4" />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing saved yet, and none are shared.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((playlist) => (
              <PlaylistRow
                key={playlist.id}
                playlist={playlist}
                mine={playlist.owner_discord_id === user?.discord_user_id}
                canQueue={canQueue}
                onQueue={(payload) => command.mutate(payload)}
              />
            ))}
          </ul>
        )}
        {!canQueue && rows.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Join a voice channel with a music bot in it to queue one of these.
          </p>
        )}
      </Card>
    </div>
  );
}
