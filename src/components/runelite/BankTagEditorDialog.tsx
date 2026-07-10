import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { runeliteConfigsApi } from "@/api/runeliteConfigs";
import { BankTagDisplay } from "./BankTagDisplay";
import { parseBankTag } from "./bankTag";
import type { RuneLiteConfig } from "@/types/runeliteConfig";

interface Props {
  open: boolean;
  initial: RuneLiteConfig | null;
  onClose: () => void;
  onSaved: (config: RuneLiteConfig) => void;
}

export function BankTagEditorDialog({ open, initial, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [raw, setRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setRaw(initial ? ((initial.data[0] as string) ?? "") : "");
    setError(null);
  }, [open, initial]);

  const layout = useMemo(() => parseBankTag(raw), [raw]);

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!layout || layout.slots.length === 0) {
      setError("Paste a valid bank tag layout export.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        type: "bank_tag",
        name,
        description,
        data: [raw.trim()],
      };
      const saved = initial
        ? await runeliteConfigsApi.update(initial.id, body)
        : await runeliteConfigsApi.create(body);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl space-y-4">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Bank Tag Layout" : "New Bank Tag Layout"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              RuneLite bank tag layout export
            </label>
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="banktags,1,slayer,27281,layout,0,27281,1,23075,..."
              className="mt-1 max-h-48 overflow-y-auto font-mono text-xs"
              rows={6}
            />
          </div>
        </div>

        {layout && layout.slots.length > 0 && (
          <div className="max-h-72 overflow-y-auto">
            <BankTagDisplay raw={raw} />
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
