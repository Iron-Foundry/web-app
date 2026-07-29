import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useMusic } from "@/context/MusicContext";
import {
  useMayControl,
  useMusicQueue,
  useSendMusicCommand,
} from "@/hooks/useMusic";
import { useNowTick } from "@/hooks/useNowTick";
import { duration, livePosition, SOURCE_ACCENT, sourceLabel } from "./format";
import { NoSession } from "./NoSession";
import { SessionSwitcher } from "./SessionSwitcher";
import { TrackArt } from "./TrackArt";
import { TransportControls } from "./TransportControls";
import { cn } from "@/lib/utils";

const UP_NEXT_SHOWN = 5;

export function NowPlayingPage(): React.ReactElement {
  const { session, channelId } = useMusic();
  const { data: control } = useMayControl(channelId);
  const { data: queue } = useMusicQueue(channelId);
  const command = useSendMusicCommand(channelId);
  const playing = session?.current != null && !session.paused;
  const now = useNowTick(playing);
  // Where the thumb is being dragged to, and then where it was dropped.
  const [scrub, setScrub] = useState<number | null>(null);
  // Whether a drag is still in hand. Distinct from `scrub`, which outlives it
  // until the bot confirms: the readout follows the pointer, not the round trip.
  const [scrubbing, setScrubbing] = useState(false);

  // A track ending mid-drag would otherwise leave the readout stranded.
  useEffect(() => setScrubbing(false), [session?.current?.identifier]);

  // The slider is controlled and the extrapolated position ticks once a second,
  // so while a drag is in progress the thumb would be pulled out from under the
  // pointer. Holding the dropped value past the commit also stops the bar
  // snapping back to the old position for the length of the round trip. The
  // session moving is the signal that the bot has actually seeked.
  useEffect(() => setScrub(null), [session?.updated_at]);

  if (!session) return <NoSession />;

  const track = session.current;
  const mayControl = control?.may_control ?? false;
  const position = livePosition(session, now);
  const upNext = (queue ?? []).slice(0, UP_NEXT_SHOWN);
  const shown =
    scrub ?? (track ? Math.min(position, track.length_ms) : position);
  const scrubPercent = track
    ? Math.min(100, Math.max(0, (shown / Math.max(1, track.length_ms)) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <SessionSwitcher />

      <Card className="p-6">
        {track ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <TrackArt url={track.artwork} className="h-24 w-24" />
              <div className="min-w-0 space-y-1">
                <p className="font-rs-bold text-lg text-primary break-words">
                  {track.title}
                </p>
                <p className="text-sm text-muted-foreground">{track.author}</p>
                <p className="text-xs text-muted-foreground">
                  Requested by{" "}
                  <span className="text-foreground">
                    {/* The bot names the requester when it queues the track. An
                        id only survives when it could not, and it is still a
                        better answer than an empty space. */}
                    {track.requester_name || track.requester_id}
                  </span>
                  {" · "}
                  <span
                    className={cn(
                      SOURCE_ACCENT[track.played_source ?? track.source],
                    )}
                  >
                    {sourceLabel(track.requested_source, track.played_source)}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {/*
                The pointer lifecycle is read here rather than from the
                slider's own callbacks. On the keyboard path Radix fires
                `onValueCommit` from inside the state updater and
                `onValueChange` after it, so a commit that cleared the flag
                would be immediately re-set by the change and the readout would
                never go away. These events only bubble, so they cannot
                interfere with the slider's own handlers either.
              */}
              <div
                className="relative"
                onPointerDown={() => {
                  if (mayControl && !track.is_stream) setScrubbing(true);
                }}
                onPointerUp={() => setScrubbing(false)}
                onPointerCancel={() => setScrubbing(false)}
              >
                {scrubbing && !track.is_stream && (
                  // Tracks the thumb, which Radix places the same way: a
                  // percentage of the track's width, centred on itself.
                  <div
                    className="pointer-events-none absolute -top-9 z-10 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium tabular-nums text-popover-foreground shadow-md"
                    style={{ left: `${scrubPercent}%` }}
                    role="status"
                    aria-live="off"
                  >
                    {duration(shown)}
                  </div>
                )}
                <Slider
                  // Remounted per track, so the reset to 0 at a track change is
                  // a fresh render rather than a second-long slide backwards.
                  key={track.identifier}
                  min={0}
                  max={Math.max(1, track.length_ms)}
                  step={1000}
                  value={[shown]}
                  // The position advances once a second; the transition fills in
                  // between, so the bar moves continuously without the page
                  // re-rendering at frame rate. Off during a drag, or the thumb
                  // would trail the pointer by a full second.
                  glide={playing && scrub === null}
                  disabled={!mayControl || track.is_stream}
                  onValueChange={(values) => setScrub(values[0] ?? null)}
                  onValueCommit={(values) => {
                    const value = values[0];
                    if (value === undefined) return;
                    command.mutate(
                      { action: "seek", position_ms: Math.round(value) },
                      // Nothing confirmed the move, so stop showing it as done.
                      { onError: () => setScrub(null) },
                    );
                  }}
                  aria-label="Seek"
                />
              </div>
              <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                <span>{track.is_stream ? "Live" : duration(shown)}</span>
                <span>
                  {track.is_stream ? "stream" : duration(track.length_ms)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing playing. Queue something from Discord or load a playlist.
          </p>
        )}

        <Separator className="my-6" />

        <TransportControls
          session={session}
          mayControl={mayControl}
          onCommand={(payload) => command.mutate(payload)}
          pending={command.isPending}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Loop {session.loop} · Shuffle {session.shuffle ? "on" : "off"} ·
          Volume {session.volume}%
        </p>
        {!mayControl && (
          <p className="mt-1 text-xs text-muted-foreground">
            Join {session.channel_name ?? "the voice channel"} to control
            playback.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <p className="font-rs-bold text-primary">Up next</p>
        <Separator className="my-4" />
        {upNext.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing queued.</p>
        ) : (
          <ol className="space-y-2">
            {upNext.map((row, index) => (
              <li
                key={`${row.identifier}-${index}`}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <TrackArt url={row.artwork} className="h-8 w-8" />
                <span className="min-w-0 flex-1 truncate">{row.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {duration(row.length_ms)}
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          {session.queue_length} track{session.queue_length === 1 ? "" : "s"},{" "}
          {duration(session.remaining_ms)} remaining
        </p>
      </Card>
    </div>
  );
}
