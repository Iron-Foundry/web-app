/** The browser's IANA time zone, for example "Europe/Stockholm". */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** A zone's offset from UTC in minutes at a moment, so daylight saving is applied. */
export function zoneOffsetMinutes(zone: string, at: Date): number {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  if (!part || part === "GMT") return 0;
  const sign = part[3] === "-" ? -1 : 1;
  const [hours, minutes = "0"] = part.slice(4).split(":");
  return sign * (Number(hours) * 60 + Number(minutes));
}

export interface OffsetLabel {
  text: string;
  title: string;
}

function span(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** How far a member's zone is ahead of or behind the viewer's, as "+2h", "-5h 30m" or "±0h". */
export function relativeOffsetLabel(memberZone: string, viewerZone: string, at: Date): OffsetLabel {
  const diff = zoneOffsetMinutes(memberZone, at) - zoneOffsetMinutes(viewerZone, at);
  if (diff === 0) return { text: "±0h", title: "Same time as you" };
  const amount = span(Math.abs(diff));
  return diff > 0
    ? { text: `+${amount}`, title: `${amount} ahead of you (${memberZone})` }
    : { text: `-${amount}`, title: `${amount} behind you (${memberZone})` };
}
