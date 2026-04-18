import { useEffect, useState } from "react";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronUp, ChevronDown, Plus, Trash2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TemplateEntry {
  template_id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  visibility: string[] | null;
  category: "survey" | "application";
  is_active: boolean;
  response_count: number;
  web_response_count: number;
  user_submitted: boolean;
  created_at?: string | null;
}

interface FieldDraft {
  id: string;
  type: "yes_no" | "short_text" | "long_text" | "select";
  label: string;
  description: string;
  required: boolean;
  options: string[];
  max_choices: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "field"
  );
}

function emptyField(): FieldDraft {
  return {
    id: "",
    type: "short_text",
    label: "",
    description: "",
    required: false,
    options: [],
    max_choices: 1,
  };
}

const FIELD_TYPES: { value: FieldDraft["type"]; label: string }[] = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "yes_no", label: "Yes / No" },
  { value: "select", label: "Select" },
];

// ── FieldEditor ───────────────────────────────────────────────────────────────

function FieldEditor({
  field,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  field: FieldDraft;
  index: number;
  total: number;
  onChange: (idx: number, next: FieldDraft) => void;
  onRemove: (idx: number) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
}) {
  function set<K extends keyof FieldDraft>(key: K, val: FieldDraft[K]) {
    onChange(index, { ...field, [key]: val });
  }

  function handleLabelBlur() {
    if (!field.id) set("id", slugify(field.label));
  }

  function addOption() {
    set("options", [...field.options, ""]);
  }

  function setOption(i: number, val: string) {
    const next = [...field.options];
    next[i] = val;
    set("options", next);
  }

  function removeOption(i: number) {
    set("options", field.options.filter((_, j) => j !== i));
  }

  return (
    <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-xs font-mono">
          {index + 1}
        </Badge>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Label *</p>
          <Input
            value={field.label}
            onChange={(e) => set("label", e.target.value)}
            onBlur={handleLabelBlur}
            placeholder="Question text"
            className="h-7 text-sm"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Type</p>
          <Select value={field.type} onValueChange={(v) => set("type", v as FieldDraft["type"])}>
            <SelectTrigger className="h-7 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-sm">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Field ID</p>
          <Input
            value={field.id}
            onChange={(e) => set("id", e.target.value)}
            placeholder="auto from label"
            className="h-7 text-sm font-mono"
          />
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => set("required", e.target.checked)}
              className="rounded"
            />
            Required
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Description (optional)</p>
        <Input
          value={field.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Helper text shown under the question"
          className="h-7 text-sm"
        />
      </div>

      {field.type === "select" && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Max choices</p>
            <Input
              type="number"
              min={1}
              value={field.max_choices}
              onChange={(e) => set("max_choices", Math.max(1, parseInt(e.target.value) || 1))}
              className="h-6 w-16 text-sm"
            />
            <p className="text-xs text-muted-foreground ml-auto">Options</p>
            <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={addOption}>
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          {field.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="h-7 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0"
                onClick={() => removeOption(i)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TemplateEditorDialog ──────────────────────────────────────────────────────

export function TemplateEditorDialog({
  open,
  editId,
  onClose,
  onSaved,
}: {
  open: boolean;
  editId: string | null;
  onClose: () => void;
  onSaved: (entry: TemplateEntry) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"survey" | "application">("survey");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    if (!editId) {
      setTitle("");
      setCategory("survey");
      setDescription("");
      setFields([]);
      setError(null);
      return;
    }

    setLoadingEdit(true);
    fetch(`${API_URL}/surveys/${editId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setTitle(data.title ?? "");
        setCategory(data.category ?? "survey");
        setDescription(data.description ?? "");
        setFields(
          (data.fields ?? []).map((f: Record<string, unknown>) => ({
            id: String(f.id ?? ""),
            type: (f.type as FieldDraft["type"]) ?? "short_text",
            label: String(f.label ?? ""),
            description: String(f.description ?? ""),
            required: Boolean(f.required),
            options: Array.isArray(f.options) ? (f.options as string[]) : [],
            max_choices: Number(f.max_choices ?? 1),
          }))
        );
        setError(null);
      })
      .catch(() => setError("Failed to load template."))
      .finally(() => setLoadingEdit(false));
  }, [open, editId]);

  function handleFieldChange(idx: number, next: FieldDraft) {
    setFields((prev) => prev.map((f, i) => (i === idx ? next : f)));
  }

  function handleFieldRemove(idx: number) {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleFieldMove(idx: number, dir: -1 | 1) {
    setFields((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return next;
    });
  }

  function addField() {
    setFields((prev) => [...prev, emptyField()]);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    for (const f of fields) {
      if (!f.label.trim()) {
        setError("All fields must have a label.");
        return;
      }
    }

    // Ensure all field IDs are set
    const resolvedFields = fields.map((f) => ({
      ...f,
      id: f.id.trim() || slugify(f.label),
    }));

    setSaving(true);
    setError(null);

    const body = {
      title: title.trim(),
      category,
      description: description.trim() || null,
      fields: resolvedFields,
    };

    try {
      const res = await fetch(
        editId ? `${API_URL}/surveys/${editId}` : `${API_URL}/surveys`,
        {
          method: editId ? "PUT" : "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.detail ?? "Save failed.");
        return;
      }

      const saved = (await res.json()) as TemplateEntry;
      onSaved(saved);
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit template" : "New template"}</DialogTitle>
        </DialogHeader>

        {loadingEdit ? (
          <p className="text-sm text-muted-foreground py-4">Loading…</p>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1">
              <p className="text-sm font-medium">Title *</p>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Survey title"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <p className="text-sm font-medium">Category</p>
              <div className="flex gap-2">
                {(["survey", "application"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                      category === c
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {c === "survey" ? "Survey" : "Application"}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <p className="text-sm font-medium">Description (optional)</p>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description shown to members"
                rows={2}
              />
            </div>

            <Separator />

            {/* Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Questions
                  <span className="text-muted-foreground font-normal ml-1.5">
                    ({fields.length})
                  </span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={addField}
                >
                  <Plus className="h-3 w-3" />
                  Add question
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">No questions yet.</p>
              )}

              {fields.map((field, i) => (
                <FieldEditor
                  key={i}
                  field={field}
                  index={i}
                  total={fields.length}
                  onChange={handleFieldChange}
                  onRemove={handleFieldRemove}
                  onMove={handleFieldMove}
                />
              ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editId ? "Save changes" : "Create template"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
