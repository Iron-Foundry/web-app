import { useState } from "react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import type { ProgressMarker } from "@/lib/tilerace-progress";

interface ProgressTeamMarkerProps {
  marker: ProgressMarker;
}

export function ProgressTeamMarker({ marker }: ProgressTeamMarkerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const { team, percent, offset, offsetY, step, totalSteps } = marker;

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (!next) setPinned(false);
  }

  function handleClick(): void {
    if (pinned) {
      setPinned(false);
      setOpen(false);
      return;
    }
    setPinned(true);
    setOpen(true);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <button
          type="button"
          aria-label={`${team.name}, ${Math.round(percent)} percent complete`}
          onPointerEnter={() => setOpen(true)}
          onPointerLeave={() => {
            if (!pinned) setOpen(false);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (!pinned) setOpen(false);
          }}
          onClick={handleClick}
          className="absolute top-1/2 z-20 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-background/80 shadow-lg shadow-black/30 transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-primary"
          style={{
            left: `${percent}%`,
            backgroundColor: team.color,
            transform: `translate(calc(-50% + ${offset}px), calc(-50% + ${offsetY}px))`,
          }}
        >
          {team.icon_url ? (
            <img src={team.icon_url} alt="" className="h-6 w-6 object-contain" />
          ) : (
            <span className="text-sm font-bold leading-none text-white">
              {team.name.charAt(0).toUpperCase()}
            </span>
          )}
        </button>
      </PopoverAnchor>

      <PopoverContent
        side="top"
        sideOffset={10}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={`w-auto min-w-44 rounded-2xl border-primary/30 p-4 ${
          pinned ? "" : "pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: team.color }}
          />
          <span className="truncate text-sm font-semibold">{team.name}</span>
        </div>
        <p className="mt-2 font-rs-bold text-3xl leading-none text-primary">
          {Math.round(percent)}%
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {totalSteps > 0 ? `Step ${step} of ${totalSteps}` : "Board not mapped yet"}
        </p>
      </PopoverContent>
    </Popover>
  );
}
