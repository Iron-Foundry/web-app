import { Badge } from "@/components/ui/badge";

export const SUGGESTION_STATUSES = [
  { value: "open",          label: "Open" },
  { value: "needs-triage",  label: "Needs Triage" },
  { value: "planned",       label: "Planned" },
  { value: "implemented",   label: "Implemented" },
  { value: "wont-add",      label: "Won't Add" },
] as const;

export const BUG_STATUSES = [
  { value: "open",          label: "Open" },
  { value: "needs-triage",  label: "Needs Triage" },
  { value: "reviewing",     label: "Reviewing" },
  { value: "planned",       label: "Planned" },
  { value: "patched",       label: "Patched" },
  { value: "wont-fix",      label: "Won't Fix" },
] as const;

export const STATUS_LABEL: Record<string, string> = {
  "open":         "Open",
  "needs-triage": "Needs Triage",
  "planned":      "Planned",
  "implemented":  "Implemented",
  "wont-add":     "Won't Add",
  "reviewing":    "Reviewing",
  "patched":      "Patched",
  "wont-fix":     "Won't Fix",
};

export function statusBadge(status: string) {
  const label = STATUS_LABEL[status] ?? status;
  switch (status) {
    case "open":
      return <Badge variant="default" className="text-xs">{label}</Badge>;
    case "needs-triage":
      return <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">{label}</Badge>;
    case "planned":
      return <Badge variant="outline" className="text-xs border-blue-500 text-blue-600 dark:text-blue-400">{label}</Badge>;
    case "reviewing":
      return <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">{label}</Badge>;
    case "implemented":
    case "patched":
      return <Badge variant="outline" className="text-xs border-green-500 text-green-600 dark:text-green-400">{label}</Badge>;
    case "wont-add":
    case "wont-fix":
      return <Badge variant="destructive" className="text-xs">{label}</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{label}</Badge>;
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
