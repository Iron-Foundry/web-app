import { useRef } from "react";
import { X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import type { FeedbackAttachment } from "./FeedbackCard";

interface AttachmentUploaderProps {
  attachments: FeedbackAttachment[];
  onChange: (attachments: FeedbackAttachment[]) => void;
  disabled?: boolean;
}

export function AttachmentUploader({ attachments, onChange, disabled }: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const toUpload = Array.from(files).slice(0, 5 - attachments.length);
    for (const file of toUpload) {
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch(`${API_URL}/feedback/upload-attachment`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: form,
        });
        if (res.ok) {
          const asset = await res.json() as FeedbackAttachment;
          onChange([...attachments, asset]);
        }
      } catch {
        // silent - individual upload failures don't block submission
      }
    }
  }

  function removeAttachment(id: string) {
    onChange(attachments.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => (
          <div
            key={a.id}
            className="relative group overflow-hidden rounded-md border bg-muted/40"
          >
            <img
              src={`${API_URL}${a.url}`}
              alt={a.original_name}
              className="h-20 w-20 object-cover"
            />
            <button
              type="button"
              onClick={() => removeAttachment(a.id)}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        ))}

        {attachments.length < 5 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="h-20 w-20 flex flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed gap-1"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px]">Add image</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {attachments.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {attachments.length}/5 image{attachments.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
