import type { FeedbackItem } from "@/components/feedback/FeedbackCard";
import type { FeedbackType } from "@/lib/feedbackDraft";

export const ARCHIVED_STATUSES: Record<FeedbackType, Set<string>> = {
  suggestion: new Set(["implemented", "wont-add"]),
  bug: new Set(["patched", "wont-fix"]),
};

const STATUS_ORDER: Record<string, number> = {
  "needs-triage": 0,
  "open":         1,
  "reviewing":    2,
  "planned":      3,
};

/** Active posts by status, then by the newest reply or post time. */
export function sortActive(items: FeedbackItem[]): FeedbackItem[] {
  return [...items].sort((a, b) => {
    const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    const aTime = a.last_reply_at ?? a.created_at;
    const bTime = b.last_reply_at ?? b.created_at;
    return bTime.localeCompare(aTime);
  });
}
