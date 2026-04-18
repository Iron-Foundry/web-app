import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { EntryEditor } from "./EntryEditor";
import { useContentContext } from "./ContentLayout";

interface EntryAuthor {
  discord_user_id: number | null;
  discord_username: string | null;
  rsn: string | null;
  avatar: string | null;
}

interface EntryDetail {
  id: string;
  title: string;
  body: string;
  created_at: string | null;
  updated_at: string | null;
  author: EntryAuthor | null;
  collaborators: EntryAuthor[];
}

function AuthorChip({ user }: { user: EntryAuthor }) {
  return (
    <span className="flex items-center gap-1.5">
      {user.avatar && (
        <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
      )}
      <span className="font-medium">{user.rsn ?? user.discord_username ?? "Unknown"}</span>
    </span>
  );
}

interface ContentEntryPageProps {
  entryId: string;
  /** e.g. "/plugins" or "/resources" */
  routeBase: string;
}

export function ContentEntryPage({ entryId, routeBase }: ContentEntryPageProps) {
  const { pageType, pageId, refreshTree } = useContentContext();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const effectiveRoles = user?.effective_roles ?? [];
  const canEdit = hasPermission(pageId, "edit", effectiveRoles);
  const canDelete = hasPermission(pageId, "delete", effectiveRoles);

  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode is local state — also auto-enable for brand new entries (empty body)
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setEditMode(false);
    fetch(`${API_URL}/content/${pageType}/entries/${entryId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: EntryDetail) => {
        setEntry(data);
        // Auto-enter edit mode if body is empty (brand new entry)
        if (!data.body && canEdit) setEditMode(true);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [entryId, pageType]);

  async function handleSave(newBody: string) {
    if (!entry) return;
    setSaving(true);
    setSaveError(null);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/content/${pageType}/entries/${entryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ body: newBody }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.detail ?? "Failed to save.");
        return;
      }
      // Refresh entry and exit edit mode
      const updated = await fetch(`${API_URL}/content/${pageType}/entries/${entryId}`).then((r) =>
        r.json(),
      );
      setEntry(updated);
      setEditMode(false);
      refreshTree();
    } catch {
      setSaveError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry) return;
    if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    const token = getAuthToken();
    try {
      await fetch(`${API_URL}/content/${pageType}/entries/${entryId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      refreshTree();
      navigate({ to: routeBase });
    } catch {
      // best effort
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (error || !entry) {
    return (
      <p className="text-destructive text-sm">
        {error ?? "Entry not found."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-rs-bold text-3xl text-primary leading-tight">{entry.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && !editMode && (
            <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
          {canDelete && !editMode && (
            <Button size="sm" variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Save error */}
      {saveError && <p className="text-xs text-destructive">{saveError}</p>}

      {/* Editor or renderer */}
      {editMode ? (
        <EntryEditor
          initialBody={entry.body}
          onSave={handleSave}
          onCancel={() => setEditMode(false)}
          saving={saving}
        />
      ) : (
        <div className="min-h-[100px]">
          {entry.body ? (
            <MarkdownRenderer body={entry.body} />
          ) : (
            <p className="text-muted-foreground text-sm italic">No content yet.</p>
          )}
        </div>
      )}

      {/* Author / collaborator footer */}
      {!editMode && (entry.author || entry.collaborators.length > 0) && (
        <div className="mt-8 pt-4 border-t border-border flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {entry.author && (
            <>
              <span>Written by</span>
              <AuthorChip user={entry.author} />
            </>
          )}
          {entry.collaborators.length > 0 && (
            <>
              <span>· Edited by</span>
              {entry.collaborators.map((c, i) => (
                <AuthorChip key={c.discord_user_id ?? i} user={c} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
