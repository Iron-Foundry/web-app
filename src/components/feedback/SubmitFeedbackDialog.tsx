import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { EMPTY_DRAFT, draftBody, draftError, type FeedbackType } from "@/lib/feedbackDraft";
import type { FeedbackItem } from "./FeedbackCard";
import { FeedbackFields } from "./FeedbackFields";

interface SubmitFeedbackDialogProps {
  type: FeedbackType;
  onSubmitted: (item: FeedbackItem) => void;
}

export function SubmitFeedbackDialog({ type, onSubmitted }: SubmitFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setDraft(EMPTY_DRAFT);
      setError(null);
    }
  }

  async function handleSubmit() {
    const missing = draftError(draft, type);
    if (missing) { setError(missing); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...draftBody(draft, type) }),
      });
      if (res.status === 201) {
        const newItem = await res.json() as FeedbackItem;
        onSubmitted(newItem);
        toast.success(type === "suggestion" ? "Suggestion submitted!" : "Bug report submitted!");
        handleOpenChange(false);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.detail ?? "Submission failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const label = type === "suggestion" ? "Suggestion" : "Bug Report";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Submit {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <FeedbackFields type={type} draft={draft} onChange={setDraft} disabled={submitting} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
