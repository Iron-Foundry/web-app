import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";

interface NewEntryDialogProps {
  open: boolean;
  onClose: () => void;
  pageType: string;
  categoryId: string;
  routeBase: string;
  onSuccess: () => void;
}

export function NewEntryDialog({
  open,
  onClose,
  pageType,
  categoryId,
  routeBase,
  onSuccess,
}: NewEntryDialogProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTitle("");
      setSlug("");
      setSlugEdited(false);
      setError(null);
    }
  }, [open]);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugEdited) setSlug(slugify(val));
  }

  function handleSlugChange(val: string) {
    setSlug(val);
    setSlugEdited(val !== "" && val !== slugify(title));
  }

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    };

    try {
      const payload: Record<string, string> = { title: trimmed };
      if (slug.trim()) payload.slug = slug.trim();
      const res = await fetch(
        `${API_URL}/content/${pageType}/categories/${categoryId}/entries`,
        { method: "POST", headers, body: JSON.stringify(payload) },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Failed to create entry.");
        return;
      }
      const created = await res.json();
      onSuccess();
      onClose();
      navigate({ to: `${routeBase}/$slug`, params: { slug: created.slug } });
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  const preview = slug || slugify(title);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="entry-title">Title</Label>
            <Input
              id="entry-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Entry title"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="entry-slug">Slug</Label>
            <Input
              id="entry-slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder={slugify(title) || "auto-generated"}
              className="font-mono text-sm"
            />
            {preview && (
              <p className="text-xs text-muted-foreground">
                URL: <span className="font-mono">{preview}</span>
              </p>
            )}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
