import type { Vibe } from "@/types/parties";

export const VIBE_LABEL: Record<Vibe, string> = {
  learning: "Learning",
  chill: "Chill",
  sweat: "Sweat",
};

export const VIBE_CLASS: Record<Vibe, string> = {
  learning: "bg-mk-blue/15 text-mk-blue border-mk-blue/30",
  chill: "bg-mk-green/15 text-mk-green border-mk-green/30",
  sweat: "bg-mk-red/15 text-mk-red border-mk-red/30",
};

/** The vibe's colour as plain text, for the word on a party card. */
export const VIBE_TEXT: Record<Vibe, string> = {
  learning: "text-mk-blue",
  chill: "text-mk-green",
  sweat: "text-mk-red",
};

export function displayName(user: { username: string; rsn: string | null }): string {
  return user.rsn || user.username;
}

export function fmtScheduled(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit",
  });
}

export function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hrs = Math.floor(abs / 3600000);
  if (abs < 60000) return diff < 0 ? "just now" : "in a moment";
  if (hrs < 1) return diff < 0 ? `${mins}m ago` : `in ${mins}m`;
  if (hrs < 24) return diff < 0 ? `${hrs}h ago` : `in ${hrs}h`;
  return new Date(iso).toLocaleDateString();
}

export function splitLocalDatetime(iso: string | null): [string, string] {
  if (!iso) return ["", ""];
  const d = new Date(iso);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return [date, time];
}
