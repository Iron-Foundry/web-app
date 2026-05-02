import type { Vibe } from "@/types/parties";

export const VIBE_LABEL: Record<Vibe, string> = {
  learning: "Learning",
  chill: "Chill",
  sweat: "Sweat",
};

export const VIBE_CLASS: Record<Vibe, string> = {
  learning: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  chill: "bg-green-500/15 text-green-400 border-green-500/20",
  sweat: "bg-red-500/15 text-red-400 border-red-500/20",
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
