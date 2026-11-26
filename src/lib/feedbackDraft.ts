import type { FeedbackAttachment, FeedbackItem } from "@/components/feedback/FeedbackCard";

export type FeedbackType = "suggestion" | "bug";

/** The fields of a feedback post while it is written or edited. */
export interface FeedbackDraft {
  title: string;
  description: string;
  steps: string;
  anonymous: "yes" | "no";
  attachments: FeedbackAttachment[];
}

export const EMPTY_DRAFT: FeedbackDraft = { title: "", description: "", steps: "", anonymous: "no", attachments: [] };

export function draftFromItem(item: FeedbackItem): FeedbackDraft {
  return {
    title: item.title,
    description: item.description,
    steps: item.extra?.steps_to_reproduce ?? "",
    anonymous: item.is_anonymous ? "yes" : "no",
    attachments: item.attachments ?? [],
  };
}

/** The first missing required field as a message, or null when the draft can be sent. */
export function draftError(draft: FeedbackDraft, type: FeedbackType): string | null {
  if (!draft.title.trim()) return "Title is required.";
  if (!draft.description.trim()) return "Description is required.";
  if (type === "bug" && !draft.steps.trim()) return "Steps to reproduce are required.";
  return null;
}

/** The request body the feedback API takes for a draft, on submit and on edit. */
export function draftBody(draft: FeedbackDraft, type: FeedbackType): Record<string, unknown> {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    ...(type === "bug" && { steps_to_reproduce: draft.steps.trim() }),
    is_anonymous: draft.anonymous === "yes",
    attachment_ids: draft.attachments.map((a) => a.id),
  };
}
