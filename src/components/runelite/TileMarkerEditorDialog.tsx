import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { runeliteConfigsApi } from "@/api/runeliteConfigs";
import { TileMarkerConfigMap } from "@/components/map/variants/TileMarkerConfigMap";
import type { RuneLiteConfig, TileMarkerData } from "@/types/runeliteConfig";

interface ParsedResult {
  markers: TileMarkerData[];
  error: string | null;
}

function parseMarkers(text: string): ParsedResult {
  if (!text.trim()) return { markers: [], error: null };
  try {
    const value = JSON.parse(text);
    if (!Array.isArray(value)) return { markers: [], error: "Data must be a JSON array." };
    for (const item of value) {
      if (
        typeof item?.regionId !== "number" ||
        typeof item?.regionX !== "number" ||
        typeof item?.regionY !== "number"
      ) {
        return { markers: [], error: "Each tile needs numeric regionId, regionX, regionY." };
      }
    }
    return { markers: value as TileMarkerData[], error: null };
  } catch {
    return { markers: [], error: "Invalid JSON." };
  }
}

interface Props {
  open: boolean;
  initial: RuneLiteConfig | null;
  onClose: () => void;
  onSaved: (config: RuneLiteConfig) => void;
}

export function TileMarkerEditorDialog({ open, initial, onClose, onSaved }: Props) {
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

  const parsed = useMemo(() => parseMarkers(jsonText), [jsonText]);

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    if (parsed.markers.length === 0) {
      setError("Paste at least one tile marker.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        type: "tile_marker",
        name,
        description,
        data: parsed.markers,
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
          <DialogTitle>{initial ? "Edit Tile Marker" : "New Tile Marker"}</DialogTitle>
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
              RuneLite tile marker export (JSON)
            </label>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[{"regionId":13395,"regionX":7,"regionY":46,"z":2,"color":"#FF000000","label":"Anchor"}]'
              className="mt-1 max-h-48 overflow-y-auto font-mono text-xs"
              rows={6}
            />
          </div>
        </div>

        {parsed.error && <p className="text-xs text-destructive">{parsed.error}</p>}
        {parsed.markers.length > 0 && (
          <TileMarkerConfigMap className="h-72 rounded-md border border-border" markers={parsed.markers} />
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
