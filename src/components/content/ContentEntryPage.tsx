import { useState } from "react";
import { Check, Copy, Download, Heart, History, Pencil, Trash2 } from "lucide-react";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { EntryEditor } from "./EntryEditor";
import { useContentContext } from "./ContentLayout";
import { VersionHistoryDialog } from "./VersionHistoryDialog";
import { useContentEntry, downloadMd } from "@/hooks/useContentEntry";
import { slugify } from "@/lib/utils";
import type { EntryAuthor } from "@/types/content";

interface ContentEntryPageProps {
  slug: string;
  routeBase: string;
}

function AuthorChip({ user }: { user: EntryAuthor }) {
  return (
    <span className="flex items-center gap-1.5">
      {user.avatar && <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />}
      <span className="font-medium">{user.rsn ?? user.discord_username ?? "Unknown"}</span>
    </span>
  );
}

export function ContentEntryPage({ slug, routeBase }: ContentEntryPageProps) {
  const { pageType, pageId, refreshTree } = useContentContext();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const effectiveRoles = user?.effective_roles ?? [];
  const canEdit = hasPermission(pageId, "edit", effectiveRoles);
  const canDelete = hasPermission(pageId, "delete", effectiveRoles);

  const e = useContentEntry(slug, pageType, canEdit, routeBase, refreshTree);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (e.loading) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (e.error || !e.entry) return <p className="text-destructive text-sm">{e.error ?? "Entry not found."}</p>;

  const entry = e.entry;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
        <h1 className="font-rs-bold text-3xl text-primary leading-tight">{entry.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && !e.editMode && (
            <>
              <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)}>
                <History className="h-3.5 w-3.5 mr-1.5" />
                History
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                e.setEditTitle(entry.title);
                e.setEditSlug(entry.slug);
                e.setSlugEdited(false);
                e.latestBodyRef.current = entry.body;
                e.setEditMode(true);
              }}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </>
          )}
          {canDelete && !e.editMode && (
            <Button size="sm" variant="outline" onClick={e.handleDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {e.saveError && <p className="text-xs text-destructive">{e.saveError}</p>}

      {e.editMode ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/30 p-3">
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
            <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
              <span className="flex-1 text-foreground">
                <span className="font-semibold text-destructive">Edit conflict - </span>
                this entry was modified by someone else while you were editing.
              </span>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs"
                  onClick={() => e.handleSave(e.latestBodyRef.current, true)} disabled={e.saving}>
                  Save anyway
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                  onClick={e.discardChanges} disabled={e.saving}>
                  Discard my changes
                </Button>
              </div>
            </div>
          )}
          <EntryEditor
            initialBody={entry.body}
            onSave={e.handleSave}
            onCancel={() => { e.setEditMode(false); }}
            saving={e.saving}
            onBodyChange={(b) => { e.latestBodyRef.current = b; }}
          />
        </div>
      ) : (
        <div className="min-h-25">
          {entry.body
            ? <MarkdownRenderer body={entry.body} />
            : <p className="text-muted-foreground text-sm italic">No content yet.</p>}
        </div>
      )}

      {!e.editMode && (entry.author || entry.created_at || entry.updated_at) && (
        <div className="mt-8 pt-4 border-t border-border flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          {entry.created_at && (
            <div className="flex items-center gap-1.5">
              <span>Created</span>
              <span className="text-foreground">{new Date(entry.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
              {entry.author && (<><span>by</span><AuthorChip user={entry.author} /></>)}
            </div>
          )}
          {entry.updated_at && entry.updated_at !== entry.created_at && (
            <div className="flex items-center gap-1.5">
              <span>Last updated</span>
              <span className="text-foreground">{new Date(entry.updated_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
              {entry.last_updated_by && (<><span>by</span><AuthorChip user={entry.last_updated_by} /></>)}
            </div>
          )}
        </div>
      )}

      {!e.editMode && (
        <div className="flex items-center gap-2">
          {user ? (
            <button onClick={e.handleReact} disabled={e.reacting}
              title={e.reacted ? "Remove reaction" : "Mark as useful"}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">
              <Heart className="h-4 w-4 shrink-0 transition-colors"
                style={e.reacted ? { fill: "currentColor", color: "rgb(239 68 68)" } : {}} />
              <span className="tabular-nums">{e.reactionCount}</span>
            </button>
          ) : (
            <span title="Log in to react" className="flex items-center gap-1.5 px-2.5 py-1 text-sm text-muted-foreground cursor-default">
              <Heart className="h-4 w-4 shrink-0" />
              <span className="tabular-nums">{e.reactionCount}</span>
            </span>
          )}
        </div>
      )}

      {!e.editMode && entry.body && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => e.handleCopy("raw")}>
            {e.copied === "raw" ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {e.copied === "raw" ? "Copied!" : "Copy Raw"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => e.handleCopy("discord")}>
            {e.copied === "discord" ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {e.copied === "discord" ? "Copied!" : "Copy for Discord"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadMd(entry.title, entry.body)}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export .md
          </Button>
        </div>
      )}

      {e.entryId && (
        <VersionHistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          pageType={pageType}
          entryId={e.entryId}
          onRestored={e.onRestored}
        />
      )}
    </div>
  );
}
