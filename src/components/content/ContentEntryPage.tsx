import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { EntryEditor } from "./EntryEditor";
import { useContentContext } from "./ContentLayout";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "";
}

interface EntryAuthor {
  discord_user_id: number | null;
  discord_username: string | null;
  rsn: string | null;
  avatar: string | null;
}

interface EntryDetail {
  id: string;
  title: string;
  slug: string;
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
  slug: string;
  /** e.g. "/plugins" or "/resources" */
  routeBase: string;
}

export function ContentEntryPage({ slug, routeBase }: ContentEntryPageProps) {
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
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // entryId (UUID) obtained after fetching by slug — used for PUT/DELETE
  const [entryId, setEntryId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setEditMode(false);
    setEntryId(null);
    fetch(`${API_URL}/content/${pageType}/entries/by-slug/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: EntryDetail) => {
        setEntry(data);
        setEntryId(data.id);
        setEditTitle(data.title);
        setEditSlug(data.slug);
        setSlugEdited(false);
        // Auto-enter edit mode if body is empty (brand new entry)
        if (!data.body && canEdit) setEditMode(true);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [entryId, pageType]);

  async function handleSave(newBody: string) {
    if (!entry || !entryId) return;
    setSaving(true);
    setSaveError(null);
    const token = getAuthToken();
    try {
      const payload: Record<string, string> = { body: newBody };
      const trimmedTitle = editTitle.trim();
      if (trimmedTitle && trimmedTitle !== entry.title) payload.title = trimmedTitle;
      const trimmedSlug = editSlug.trim();
      if (trimmedSlug && trimmedSlug !== entry.slug) payload.slug = trimmedSlug;

      const res = await fetch(`${API_URL}/content/${pageType}/entries/${entryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.detail ?? "Failed to save.");
        return;
      }
      const saved = await res.json() as { slug: string };
      setEditMode(false);
      refreshTree();
      // If slug changed, navigate to the new URL; otherwise re-fetch in place
      if (saved.slug !== slug) {
        navigate({ to: `${routeBase}/$slug`, params: { slug: saved.slug } });
      } else {
        const updated = await fetch(`${API_URL}/content/${pageType}/entries/by-slug/${encodeURIComponent(saved.slug)}`).then((r) => r.json());
        setEntry(updated);
        setEditTitle(updated.title);
        setEditSlug(updated.slug);
        setSlugEdited(false);
      }
    } catch {
      setSaveError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry || !entryId) return;
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
            <Button size="sm" variant="outline" onClick={() => {
              setEditTitle(entry.title);
              setEditSlug(entry.slug);
              setSlugEdited(false);
              setEditMode(true);
            }}>
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
        <div className="space-y-4">
          {/* Title + slug metadata */}
          <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/30 p-3">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  if (!slugEdited) setEditSlug(slugify(e.target.value));
                }}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Slug</Label>
              <Input
                value={editSlug}
                onChange={(e) => {
                  setEditSlug(e.target.value);
                  setSlugEdited(e.target.value !== "" && e.target.value !== slugify(editTitle));
                }}
                className="h-8 font-mono text-sm"
                placeholder={slugify(editTitle) || "slug"}
              />
            </div>
          </div>
          <EntryEditor
            initialBody={entry.body}
            onSave={handleSave}
            onCancel={() => setEditMode(false)}
            saving={saving}
          />
        </div>
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
