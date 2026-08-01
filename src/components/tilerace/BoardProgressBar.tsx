import { useMemo } from "react";
import type { TileRaceBoardEvent } from "@/types/tilerace";
import { buildProgressMarkers } from "@/lib/tilerace-progress";
import { ProgressTeamMarker } from "./ProgressTeamMarker";

interface BoardProgressBarProps {
  event: TileRaceBoardEvent;
}

export function BoardProgressBar({ event }: BoardProgressBarProps): JSX.Element | null {
  const markers = useMemo(
    () => buildProgressMarkers(event.cells, event.teams),
    [event.cells, event.teams],
  );

  if (markers.length === 0) return null;

  return (
    <div className="relative w-full px-6 py-8">
      <div
        aria-hidden
        className="tilerace-progress-glow pointer-events-none absolute inset-x-6 top-1/2 h-4 -translate-y-1/2"
      />
      <div className="relative h-2.5 w-full rounded-full bg-primary/10 backdrop-blur-sm">
        <div className="tilerace-progress-track absolute inset-0" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-full ring-1 ring-primary/40 ring-inset"
        />
        {markers.map((marker) => (
          <ProgressTeamMarker key={marker.team.id} marker={marker} />
        ))}
      </div>
    </div>
  );
}
