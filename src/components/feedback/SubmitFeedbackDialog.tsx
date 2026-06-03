import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AttachmentUploader } from "./AttachmentUploader";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import type { FeedbackAttachment, FeedbackItem } from "./FeedbackCard";

interface SubmitFeedbackDialogProps {
  type: "suggestion" | "bug";
  onSubmitted: (item: FeedbackItem) => void;
}

export function SubmitFeedbackDialog({ type, onSubmitted }: SubmitFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [anonymous, setAnonymous] = useState("no");
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setDescription("");
    setSteps("");
    setAnonymous("no");
    setAttachments([]);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleSubmit() {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }
    if (type === "bug" && !steps.trim()) { setError("Steps to reproduce are required."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          ...(type === "bug" && { steps_to_reproduce: steps.trim() }),
          is_anonymous: anonymous === "yes",
          attachment_ids: attachments.map((a) => a.id),
        }),
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
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          <Textarea
            placeholder={type === "suggestion" ? "Describe your suggestion..." : "Describe the bug..."}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={4000}
          />
          {type === "bug" && (
            <Textarea
              placeholder="Steps to reproduce (required)..."
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={3}
              maxLength={4000}
            />
          )}
          <AttachmentUploader
            attachments={attachments}
            onChange={setAttachments}
            disabled={submitting}
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Submit anonymously?</span>
            <ToggleGroup
              type="single"
              variant="outline"
              value={anonymous}
              onValueChange={(v) => { if (v) setAnonymous(v); }}
            >
              <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
              <ToggleGroupItem value="no">No</ToggleGroupItem>
            </ToggleGroup>
          </div>
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
