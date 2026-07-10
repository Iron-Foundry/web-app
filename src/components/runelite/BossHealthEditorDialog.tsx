import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { runeliteConfigsApi } from "@/api/runeliteConfigs";
import { BossHealthDisplay } from "./BossHealthDisplay";
import type { BossHealthData, RuneLiteConfig } from "@/types/runeliteConfig";

interface ParsedResult {
  bosses: BossHealthData[];
  error: string | null;
}

function parseBosses(text: string): ParsedResult {
  if (!text.trim()) return { bosses: [], error: null };
  try {
    const value = JSON.parse(text);
    if (!Array.isArray(value)) return { bosses: [], error: "Data must be a JSON array." };
    for (const item of value) {
      if (typeof item?.bossName !== "string" || !Array.isArray(item?.entries)) {
        return { bosses: [], error: "Each boss needs a bossName and an entries array." };
      }
    }
    return { bosses: value as BossHealthData[], error: null };
  } catch {
    return { bosses: [], error: "Invalid JSON." };
  }
}

interface Props {
  open: boolean;
  initial: RuneLiteConfig | null;
  onClose: () => void;
  onSaved: (config: RuneLiteConfig) => void;
}

export function BossHealthEditorDialog({ open, initial, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setJsonText(initial ? JSON.stringify(initial.data, null, 2) : "");
    setError(null);
  }, [open, initial]);

  const parsed = useMemo(() => parseBosses(jsonText), [jsonText]);

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    if (parsed.bosses.length === 0) {
      setError("Paste at least one boss.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = initial
        ? await runeliteConfigsApi.update(initial.id, {
            type: "boss_health",
            name,
            description,
            data: parsed.bosses,
          })
        : await runeliteConfigsApi.create({
            type: "boss_health",
            name,
            description,
            data: parsed.bosses,
          });
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
          <DialogTitle>{initial ? "Edit Boss Health Indicators" : "New Boss Health Indicators"}</DialogTitle>
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
              RuneLite boss health export (JSON)
            </label>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[{"bossName":"Nightmare","entries":[{"percentage":0.15,"color":"#FFFFFFFF","notify":false}]}]'
              className="mt-1 max-h-48 overflow-y-auto font-mono text-xs"
              rows={6}
            />
          </div>
        </div>

        {parsed.error && <p className="text-xs text-destructive">{parsed.error}</p>}
        {parsed.bosses.length > 0 && (
          <div className="max-h-72 overflow-y-auto rounded-md border border-border p-3">
            <BossHealthDisplay bosses={parsed.bosses} />
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
