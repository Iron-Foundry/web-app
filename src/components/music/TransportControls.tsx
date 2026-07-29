import { useEffect, useState } from "react";
import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipForward,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { MusicCommand, MusicSession } from "@/types/music";

const NEXT_LOOP: Record<string, "off" | "track" | "queue"> = {
  off: "track",
  track: "queue",
  queue: "off",
};

interface TransportControlsProps {
  session: MusicSession;
  mayControl: boolean;
  onCommand: (command: MusicCommand) => void;
  pending?: boolean;
}

export function TransportControls({
  session,
  mayControl,
  onCommand,
  pending = false,
}: TransportControlsProps): React.ReactElement {
  const idle = session.current === null;
  const disabled = !mayControl || pending;
  const loop = session.loop ?? "off";
  const LoopIcon = loop === "track" ? Repeat1 : Repeat;
  // Where the volume thumb is being dragged to.
  const [dragVolume, setDragVolume] = useState<number | null>(null);

  // A Radix slider given a `value` is fully controlled: the thumb sits wherever
  // the prop says, and it only commits when its own value actually changed. So
  // without feeding the drag back the slider was inert twice over - the thumb
  // never moved and no command was ever sent. Cleared once the bot confirms.
  useEffect(() => setDragVolume(null), [session.volume]);

  const volume = dragVolume ?? session.volume;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="icon"
        disabled={disabled || idle}
        onClick={() =>
          onCommand({ action: session.paused ? "resume" : "pause" })
        }
        aria-label={session.paused ? "Resume" : "Pause"}
      >
        {session.paused ? (
          <Play className="h-4 w-4" />
        ) : (
          <Pause className="h-4 w-4" />
        )}
      </Button>
      <Button
        size="icon"
        variant="secondary"
        disabled={disabled || idle}
        onClick={() => onCommand({ action: "skip" })}
        aria-label="Skip"
      >
        <SkipForward className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="destructive"
        disabled={disabled || idle}
        onClick={() => onCommand({ action: "stop" })}
        aria-label="Stop"
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={loop === "off" ? "secondary" : "default"}
        disabled={disabled}
        onClick={() => onCommand({ action: "loop", loop: NEXT_LOOP[loop] })}
        aria-label={`Loop: ${loop}`}
      >
        <LoopIcon
          className={cn("h-4 w-4", loop === "queue" && "opacity-100")}
        />
      </Button>
      <Button
        size="icon"
        variant={session.shuffle ? "default" : "secondary"}
        disabled={disabled}
        onClick={() =>
          onCommand({ action: "shuffle", shuffle: !session.shuffle })
        }
        aria-label={session.shuffle ? "Turn shuffle off" : "Turn shuffle on"}
        aria-pressed={session.shuffle}
      >
        <Shuffle className="h-4 w-4" />
      </Button>

      <div className="ml-auto flex min-w-[10rem] items-center gap-2">
        <span className="text-xs text-muted-foreground">Vol</span>
        <Slider
          className="w-28"
          min={0}
          max={150}
          step={5}
          disabled={disabled}
          value={[volume]}
          onValueChange={(values) => setDragVolume(values[0] ?? null)}
          onValueCommit={(values) => {
            const next = values[0];
            if (next === undefined) return;
            onCommand({ action: "volume", volume: Math.round(next) });
          }}
          aria-label="Volume"
        />
        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
          {volume}%
        </span>
      </div>
    </div>
  );
}
