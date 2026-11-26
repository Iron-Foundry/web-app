import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { draftBody, draftError, draftFromItem, type FeedbackType } from "@/lib/feedbackDraft";
import type { FeedbackItem } from "./FeedbackCard";
import { FeedbackFields } from "./FeedbackFields";

interface Props {
  item: FeedbackItem;
  onSaved: (item: FeedbackItem) => void;
  onClose: () => void;
}

/** The author's edit of their own open feedback post, in the submit dialog's form. */
export function EditFeedbackDialog({ item, onSaved, onClose }: Props): React.ReactElement {
  const type = item.type as FeedbackType;
  const [draft, setDraft] = useState(() => draftFromItem(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    const missing = draftError(draft, type);
    if (missing) { setError(missing); return; }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/feedback/${item.id}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(draftBody(draft, type)),
      });
      if (res.ok) {
        onSaved(await res.json() as FeedbackItem);
        toast.success("Changes saved.");
        onClose();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.detail ?? "Saving failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {type === "suggestion" ? "Suggestion" : "Bug Report"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <FeedbackFields type={type} draft={draft} onChange={setDraft} disabled={saving} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
