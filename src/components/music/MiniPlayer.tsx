import { Music2, Pause, Play, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusic } from "@/context/MusicContext";
import { useMayControl, useSendMusicCommand } from "@/hooks/useMusic";
import { useNowTick } from "@/hooks/useNowTick";
import { duration, livePosition } from "./format";

/**
 * The always-visible bar, shown only while something is actually playing.
 *
 * It is a status line first and a control second: clicking the track opens the
 * panel, and only the two controls worth reaching without opening anything are
 * on it.
 */
export function MiniPlayer(): React.ReactElement | null {
  const { session, channelId, openPanel, open } = useMusic();
  const { data: control } = useMayControl(channelId);
  const command = useSendMusicCommand(channelId);
  const playing = session?.current != null && !session.paused;
  const now = useNowTick(playing);

  if (!session?.current || open) return null;

  const track = session.current;
  const mayControl = control?.may_control ?? false;
  const position = livePosition(session, now);
  const progress = track.is_stream
    ? 0
    : Math.min(100, (position / Math.max(1, track.length_ms)) * 100);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="h-0.5 w-full bg-muted">
        <div
          // Matched to the once-a-second tick behind it, so the bar crosses
          // continuously instead of easing into a step and stopping.
          key={track.identifier}
          className="h-full bg-primary transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
        <Music2 className="h-4 w-4 shrink-0 text-primary" />
        <button
          type="button"
          onClick={() => openPanel("now-playing")}
          className="min-w-0 flex-1 truncate text-left text-sm hover:text-primary"
        >
          {track.title}
          <span className="ml-2 text-xs text-muted-foreground">
            {track.author}
          </span>
        </button>
        <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">
          {track.is_stream
            ? "live"
            : `${duration(position)} / ${duration(track.length_ms)}`}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          disabled={!mayControl || command.isPending}
          aria-label={session.paused ? "Resume" : "Pause"}
          onClick={() =>
            command.mutate({ action: session.paused ? "resume" : "pause" })
          }
        >
          {session.paused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          disabled={!mayControl || command.isPending}
          aria-label="Skip"
          onClick={() => command.mutate({ action: "skip" })}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
          {session.channel_name ?? ""}
        </span>
      </div>
    </div>
  );
}
