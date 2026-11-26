import { useState } from "react";
import { History, Pencil, Trash2 } from "lucide-react";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { EntryEditPanel } from "./EntryEditPanel";
import { EntryFooter } from "./EntryFooter";
import { useContentContext } from "./ContentLayout";
import { VersionHistoryDialog } from "./VersionHistoryDialog";
import { useContentEntry } from "@/hooks/useContentEntry";
import { TableOfContents, MobileToc, extractHeadings } from "./TableOfContents";

interface ContentEntryPageProps {
  slug: string;
  routeBase: string;
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
  const headings = entry.body ? extractHeadings(entry.body) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
        <h1 className="font-rs-bold text-4xl leading-tight text-mark">{entry.title}</h1>
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
        <EntryEditPanel e={e} body={entry.body} />
      ) : (
        <div className="flex gap-8 items-start min-h-25">
          <div className="flex-1 min-w-0 markdown-body">
            {headings.length >= 2 && (
              <div className="lg:hidden mb-5">
                <MobileToc headings={headings} />
              </div>
            )}
            {entry.body
              ? <MarkdownRenderer body={entry.body} />
              : <p className="text-muted-foreground text-sm italic">No content yet.</p>}
          </div>
          {headings.length >= 2 && (
            <aside className="hidden lg:block w-48 shrink-0 sticky top-20">
              <TableOfContents headings={headings} />
            </aside>
          )}
        </div>
      )}

      {!e.editMode && <EntryFooter entry={entry} e={e} signedIn={!!user} />}

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
