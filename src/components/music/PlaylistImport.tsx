import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useImportPlaylist } from "@/hooks/useMusicLibrary";

/**
 * Pull an existing playlist in from YouTube or YouTube Music.
 *
 * Spotify is deliberately not offered. Spotify serves a playlist, album or
 * artist page only on behalf of a signed-in account, and this server holds app
 * credentials, so those links cannot be imported at all - naming Spotify here
 * would advertise an import that always fails.
 *
 * Only the link is required - the playlist keeps the name the source gave it
 * unless one is typed. Importing resolves through Lavalink, so it needs no bot
 * and no voice channel.
 */
export function PlaylistImport(): React.ReactElement {
  const importPlaylist = useImportPlaylist();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [imported, setImported] = useState<string | null>(null);

  const run = (): void => {
    if (!url.trim()) return;
    setImported(null);
    importPlaylist.mutate(
      { url: url.trim(), name: name.trim() || null, is_public: false },
      {
        onSuccess: (playlist) => {
          setUrl("");
          setName("");
          setImported(
            `Imported ${playlist.track_count} tracks as ${playlist.name}.`,
          );
        },
      },
    );
  };

  return (
    <Card className="p-6">
      <p className="font-rs-bold text-primary">Import a playlist</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Paste a YouTube or YouTube Music playlist link. Tracks are saved as
        metadata rather than audio, so each one is looked up again when it
        plays. Spotify playlist links cannot be imported - Spotify only serves
        them to a signed-in account.
      </p>
      <Separator className="my-4" />
      <div className="flex flex-wrap gap-2">
        <Input
          className="min-w-[14rem] flex-1"
          placeholder="https://www.youtube.com/playlist?list=..."
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") run();
          }}
        />
        <Input
          className="max-w-[12rem]"
          placeholder="Name (optional)"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button
          onClick={run}
          disabled={importPlaylist.isPending || !url.trim()}
        >
          <Download className="h-4 w-4" />
          {importPlaylist.isPending ? "Importing" : "Import"}
        </Button>
      </div>
      {importPlaylist.error && (
        <p className="mt-2 text-xs text-destructive">
          {importPlaylist.error instanceof Error
            ? importPlaylist.error.message
            : "That import failed."}
        </p>
      )}
      {imported && (
        <p className="mt-2 text-xs text-muted-foreground">{imported}</p>
      )}
    </Card>
  );
}
