import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemplateEditor } from "./TemplateEditor";
import { useTemplates, useTemplate, useDeleteTemplate } from "@/hooks/useFrenzy";
import type { FrenzyTemplateSummary } from "@/types/frenzy";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function TemplateList() {
  const { data: templates, isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  if (creating || editingId !== null) {
    return (
      <TemplateEditorWrapper
        templateId={editingId}
        onSaved={() => {
          setCreating(false);
          setEditingId(null);
        }}
        onCancel={() => {
          setCreating(false);
          setEditingId(null);
        }}
      />
    );
  }

  async function handleDelete(t: FrenzyTemplateSummary) {
    if (!confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
    try {
      await deleteTemplate.mutateAsync(t.id);
      toast.success("Template deleted.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && (templates ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">No templates yet. Create one to get started.</p>
      )}
      {(templates ?? []).map((t) => (
        <Card key={t.id}>
          <CardHeader className="pb-2 pt-3 px-4 flex-row items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{t.name}</span>
                <Badge variant="secondary" className="text-xs">
                  v{t.version_number}
                </Badge>
              </div>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(t.id)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(t)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(t.updated_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TemplateEditorWrapper({
  templateId,
  onSaved,
  onCancel,
}: {
  templateId: number | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { data: template, isLoading } = useTemplate(templateId ?? 0);

  if (templateId !== null && isLoading) {
    return <p className="text-sm text-muted-foreground">Loading template...</p>;
  }

  return <TemplateEditor template={template} onSaved={onSaved} onCancel={onCancel} />;
}
