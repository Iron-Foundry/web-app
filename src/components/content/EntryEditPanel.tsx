import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { useContentEntry } from "@/hooks/useContentEntry";
import { slugify } from "@/lib/utils";
import { EntryEditor } from "./EntryEditor";

type EntryState = ReturnType<typeof useContentEntry>;

/** The edit mode of an entry: title and slug, the edit-conflict choice, and the body editor. */
export function EntryEditPanel({ e, body }: { e: EntryState; body: string }): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label className="text-xs">Title</Label>
          <Input
            value={e.editTitle}
            onChange={(ev) => {
              e.setEditTitle(ev.target.value);
              if (!e.slugEdited) e.setEditSlug(slugify(ev.target.value));
            }}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slug</Label>
          <Input
            value={e.editSlug}
            onChange={(ev) => {
              e.setEditSlug(ev.target.value);
              e.setSlugEdited(ev.target.value !== "" && ev.target.value !== slugify(e.editTitle));
            }}
            className="h-8 font-mono text-sm"
            placeholder={slugify(e.editTitle) || "slug"}
          />
        </div>
      </div>
      {e.conflictDetected && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
          <span className="flex-1">
            <span className="font-semibold text-destructive">Edit conflict - </span>
            this entry was modified by someone else while you were editing.
          </span>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={() => e.handleSave(e.latestBodyRef.current, true)} disabled={e.saving}>Save anyway</Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={e.discardChanges} disabled={e.saving}>Discard my changes</Button>
          </div>
        </div>
      )}
      <EntryEditor
        initialBody={body}
        onSave={e.handleSave}
        onCancel={() => { e.setEditMode(false); }}
        saving={e.saving}
        onBodyChange={(b) => { e.latestBodyRef.current = b; }}
      />
    </div>
  );
}
