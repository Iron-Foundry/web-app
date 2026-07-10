import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { runeliteConfigsApi } from "@/api/runeliteConfigs";
import { InventorySetupDisplay } from "./InventorySetupDisplay";
import type { InventorySetup, RuneLiteConfig } from "@/types/runeliteConfig";

interface ParsedResult {
  setup: InventorySetup | null;
  error: string | null;
}

function parseSetup(text: string): ParsedResult {
  if (!text.trim()) return { setup: null, error: null };
  try {
    const value = JSON.parse(text);
    if (!value?.setup || !Array.isArray(value.setup.inv)) {
      return { setup: null, error: "Missing setup.inv array." };
    }
    return { setup: value as InventorySetup, error: null };
  } catch {
    return { setup: null, error: "Invalid JSON." };
  }
}

interface Props {
  open: boolean;
  initial: RuneLiteConfig | null;
  onClose: () => void;
  onSaved: (config: RuneLiteConfig) => void;
}

export function InventorySetupEditorDialog({ open, initial, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setJsonText(initial ? JSON.stringify(initial.data[0], null, 2) : "");
    setError(null);
  }, [open, initial]);

  const parsed = useMemo(() => parseSetup(jsonText), [jsonText]);

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!parsed.setup) {
      setError(parsed.error ?? "Paste a valid inventory setup export.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        type: "inventory_setup",
        name,
        description,
        data: [parsed.setup],
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
          <DialogTitle>{initial ? "Edit Inventory Setup" : "New Inventory Setup"}</DialogTitle>
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
              RuneLite inventory setup export (JSON)
            </label>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{"setup":{"inv":[{"id":1523}],"eq":[],"name":"cox solo"}}'
              className="mt-1 max-h-48 overflow-y-auto font-mono text-xs"
              rows={6}
            />
          </div>
        </div>

        {parsed.error && <p className="text-xs text-destructive">{parsed.error}</p>}
        {parsed.setup && (
          <div className="max-h-72 overflow-y-auto rounded-md border border-border p-3">
            <InventorySetupDisplay setup={parsed.setup} />
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
