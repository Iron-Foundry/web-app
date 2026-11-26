import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FeedbackDraft, FeedbackType } from "@/lib/feedbackDraft";
import { AttachmentUploader } from "./AttachmentUploader";

interface Props {
  type: FeedbackType;
  draft: FeedbackDraft;
  onChange: (draft: FeedbackDraft) => void;
  disabled: boolean;
}

/** The fields of a feedback post, shared by the submit and edit dialogs. */
export function FeedbackFields({ type, draft, onChange, disabled }: Props): React.ReactElement {
  const set = (patch: Partial<FeedbackDraft>): void => onChange({ ...draft, ...patch });
  return (
    <>
      <Input placeholder="Title" value={draft.title} onChange={(e) => set({ title: e.target.value })} maxLength={200} />
      <Textarea
        placeholder={type === "suggestion" ? "Describe your suggestion..." : "Describe the bug..."}
        value={draft.description}
        onChange={(e) => set({ description: e.target.value })}
        rows={4}
        maxLength={4000}
      />
      {type === "bug" && (
        <Textarea
          placeholder="Steps to reproduce (required)..."
          value={draft.steps}
          onChange={(e) => set({ steps: e.target.value })}
          rows={3}
          maxLength={4000}
        />
      )}
      <AttachmentUploader attachments={draft.attachments} onChange={(attachments) => set({ attachments })} disabled={disabled} />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Submit anonymously?</span>
        <ToggleGroup
          type="single"
          variant="outline"
          value={draft.anonymous}
          onValueChange={(v) => {
            if (v === "yes" || v === "no") set({ anonymous: v });
          }}
        >
          <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
          <ToggleGroupItem value="no">No</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </>
  );
}
