import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMusicStats, useMusicTopTracks } from "@/hooks/useMusicStats";
import { listenedTotal, SOURCE_ACCENT } from "./format";
import { cn } from "@/lib/utils";

const WINDOWS = [7, 30, 90, 365] as const;
const TOP_TRACKS = 25;

/**
 * What the clan has listened to.
 *
 * Nothing on this page is per member and nothing can be: the counters behind it
 * carry a guild and a track, never a user id, so there is no personal listening
 * history to show even to the person who asked for it.
 */
export function StatsPage(): React.ReactElement {
  const [days, setDays] = useState<number>(30);
  const { data: stats, isLoading } = useMusicStats(days, true);
  const { data: top } = useMusicTopTracks(TOP_TRACKS, true);

  const sources = Object.entries(stats?.sources ?? {});
  const totalPlays = sources.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-rs-bold text-primary">Clan listening</p>
          <div className="flex gap-1">
            {WINDOWS.map((window) => (
              <Button
                key={window}
                size="sm"
                variant={window === days ? "secondary" : "ghost"}
                onClick={() => setDays(window)}
              >
                {window}d
              </Button>
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Counted per clan, never per person - the rows behind this carry no
          user id at all.
        </p>
        <Separator className="my-4" />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Total
              label="Listened"
              value={listenedTotal(stats?.ms_listened ?? 0)}
            />
            <Total label="Tracks played" value={stats?.tracks_played ?? 0} />
            <Total label="Skipped" value={stats?.skips ?? 0} />
            <Total label="Sessions" value={stats?.sessions ?? 0} />
          </dl>
        )}
      </Card>

      <Card className="p-6">
        <p className="font-rs-bold text-primary">Where the audio came from</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Where it actually streamed from, not where it was asked for - a
          Spotify request mirrored to YouTube counts as YouTube.
        </p>
        <Separator className="my-4" />
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing played yet.</p>
        ) : (
          <ul className="space-y-2">
            {sources.map(([source, count]) => (
              <li key={source} className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    "w-28 shrink-0 truncate",
                    SOURCE_ACCENT[source] ?? "text-muted-foreground",
                  )}
                >
                  {source}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full bg-primary"
                    style={{
                      width: `${totalPlays === 0 ? 0 : (count / totalPlays) * 100}%`,
                    }}
                  />
                </span>
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <p className="font-rs-bold text-primary">Most played</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Counted per recording rather than per link, so the same song from two
          sources is one row.
        </p>
        <Separator className="my-4" />
        {(top ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing played yet.</p>
        ) : (
          <ol className="space-y-1">
            {(top ?? []).map((track, index) => (
              <li
                key={track.track_key}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {track.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {track.author}
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {track.play_count} play{track.play_count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

function Total({
  label,
  value,
}: {
  label: string;
  value: string | number;
}): React.ReactElement {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-rs-bold text-xl text-primary tabular-nums">{value}</dd>
    </div>
  );
}
