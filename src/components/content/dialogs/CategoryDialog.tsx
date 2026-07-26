import { useEffect, useState } from "react";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { flattenCategories, type CategoryTree } from "@/lib/contentTree";

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  pageType: string;
  allCategories: CategoryTree[];
  editing?: CategoryTree | null;
  defaultParentId?: string | null;
  onSuccess: () => void;
}

export function CategoryDialog({
  open,
  onClose,
  pageType,
  allCategories,
  editing,
  defaultParentId,
  onSuccess,
}: CategoryDialogProps) {
  const [label, setLabel] = useState(editing?.label ?? "");
  const [parentId, setParentId] = useState<string>(
    editing?.parent_id ?? defaultParentId ?? "__root__",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLabel(editing?.label ?? "");
      setParentId(editing?.parent_id ?? defaultParentId ?? "__root__");
      setError(null);
    }
  }, [open, editing, defaultParentId]);

  const flat = flattenCategories(allCategories);

  async function handleSave() {
    const trimmed = label.trim();
    if (!trimmed) {
      setError("Label is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    };

    const resolvedParentId = parentId === "__root__" ? null : parentId;
    const body = JSON.stringify({ label: trimmed, parent_id: resolvedParentId });

    try {
      const res = editing
        ? await fetch(`${API_URL}/content/${pageType}/categories/${editing.id}`, {
            method: "PATCH",
            headers,
            body,
          })
        : await fetch(`${API_URL}/content/${pageType}/categories`, {
            method: "POST",
            headers,
            body,
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Failed to save category.");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-label">Label</Label>
            <Input
              id="cat-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Category name"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-parent">Parent</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger id="cat-parent">
                <SelectValue placeholder="No parent (root)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__root__">- No parent (root) -</SelectItem>
                {flat
                  .filter(({ cat }) => cat.id !== editing?.id)
                  .map(({ cat, depth }) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {"  ".repeat(depth)}
                      {cat.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
