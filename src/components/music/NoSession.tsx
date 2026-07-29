import { Card } from "@/components/ui/card";
import { useMusic } from "@/context/MusicContext";

/** What every page shows when no bot is in a voice channel. */
export function NoSession(): React.ReactElement {
  const { connected } = useMusic();
  return (
    <Card className="p-6">
      <p className="font-rs-bold text-primary">Nothing playing</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {connected
          ? "No music bot is in a voice channel right now. Start one from Discord with /play and it will appear here."
          : "Waiting for the live connection..."}
      </p>
    </Card>
  );
}
