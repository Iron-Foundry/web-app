import { relativeOffsetLabel } from "@/lib/timeZones";

/** The signed-in viewer's own zone and the moment offsets are measured at; null for a guest. */
export type ViewerZone = { zone: string; at: Date } | null;

/** The member's time zone relative to the viewer's, or nothing when either is unknown. */
export function ZoneOffset({ zone, viewer }: { zone: string | null; viewer: ViewerZone }): React.ReactElement | null {
  if (!zone || !viewer) return null;
  const label = relativeOffsetLabel(zone, viewer.zone, viewer.at);
  return (
    <span className="ml-1.5 text-xs tabular-nums text-muted-foreground" title={label.title}>
      {label.text}
    </span>
  );
}
