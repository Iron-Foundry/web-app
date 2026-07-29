import { Users, Wifi, WifiOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMusic } from "@/context/MusicContext";

/**
 * Which channel the panel is looking at.
 *
 * Hidden when only one session is live, which is the usual case - a picker with
 * a single option is noise.
 */
export function SessionSwitcher(): React.ReactElement | null {
  const { sessions, channelId, selectChannel, connected, session } = useMusic();
  if (sessions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {sessions.length > 1 ? (
        <Select
          value={channelId ?? ""}
          onValueChange={(value) => selectChannel(value)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Choose a channel" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((row) => (
              <SelectItem
                key={row.voice_channel_id}
                value={row.voice_channel_id}
              >
                {row.channel_name ?? `Channel ${row.voice_channel_id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="font-rs-bold text-primary">
          {session?.channel_name ?? "Music"}
        </p>
      )}

      {session && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {session.listener_count}
        </span>
      )}
      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
        {connected ? (
          <>
            <Wifi className="h-3.5 w-3.5" /> live
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5" /> reconnecting
          </>
        )}
      </span>
    </div>
  );
}
