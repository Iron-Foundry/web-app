import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import DOMPurify from "dompurify";
import { Check, Copy, Download, History, Pencil, Trash2 } from "lucide-react";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { EntryEditor } from "./EntryEditor";
import { useContentContext } from "./ContentLayout";
import { cacheInvalidate, fetchCached } from "@/lib/cache";
import { VersionHistoryDialog } from "./VersionHistoryDialog";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "";
}

/** Strip / convert HTML elements that Discord doesn't render. */
function toDiscordMarkdown(body: string): string {
  // Sanitize first: strip everything except <kbd> and <br> so subsequent
  // string operations run on a known-safe, normalised tag set.
  const safe = DOMPurify.sanitize(body, { ALLOWED_TAGS: ["kbd", "br"], ALLOWED_ATTR: [] });
  return safe
    .replace(/<kbd>(.*?)<\/kbd>/gi, (_, t) => `\`${t}\``)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$2");
}

function downloadMd(title: string, body: string): void {
  const filename = title.trim().replace(/[^a-z0-9\s-]/gi, "").replace(/\s+/g, "-").replace(/-+/g, "-").toLowerCase() + ".md";
  const blob = new Blob([body], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
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

  const [copied, setCopied] = useState<"raw" | "discord" | null>(null);

  function handleCopy(variant: "raw" | "discord") {
    if (!entry) return;
    const text = variant === "discord" ? toDiscordMarkdown(entry.body) : entry.body;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(variant);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  // Optimistic concurrency
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);
  const latestBodyRef = useRef<string>("");

  // entryId (UUID) obtained after fetching by slug — used for PUT/DELETE
  const [entryId, setEntryId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setEditMode(false);
    setEntryId(null);
    fetchCached<EntryDetail>(
      `${API_URL}/content/${pageType}/entries/by-slug/${encodeURIComponent(slug)}`,
      { signal: controller.signal, cacheKey: `content:entry:${pageType}:${slug}` },
    )
      .then((data) => {
        setEntry(data);
        setEntryId(data.id);
        setEditTitle(data.title);
        setEditSlug(data.slug);
        setSlugEdited(false);
        setLoadedUpdatedAt(data.updated_at);
        setConflictDetected(false);
        if (!data.body && canEdit) { latestBodyRef.current = data.body; setEditMode(true); }
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, pageType]);

  async function handleSave(newBody: string, skipConflictCheck = false) {
    if (!entry || !entryId) return;
    setSaving(true);
    setSaveError(null);
    setConflictDetected(false);
    const token = getAuthToken();
    try {
      const payload: Record<string, string | null> = { body: newBody };
      const trimmedTitle = editTitle.trim();
      if (trimmedTitle && trimmedTitle !== entry.title) payload.title = trimmedTitle;
      const trimmedSlug = editSlug.trim();
      if (trimmedSlug && trimmedSlug !== entry.slug) payload.slug = trimmedSlug;
      if (!skipConflictCheck) {
        payload.expected_updated_at = loadedUpdatedAt;
      }

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
        if (res.status === 409 && data.detail === "edit_conflict") {
          setConflictDetected(true);
          return;
        }
        setSaveError(data.detail ?? "Failed to save.");
        return;
      }
      const saved = await res.json() as { slug: string; updated_at: string | null };
      // Bust both old and new slug caches (slug may have changed)
      cacheInvalidate(`content:entry:${pageType}:`);
      setEditMode(false);
      refreshTree();
      // If slug changed, navigate to the new URL; otherwise re-fetch in place
      if (saved.slug !== slug) {
        navigate({ to: `${routeBase}/$slug`, params: { slug: saved.slug } });
      } else {
        const updated = await fetchCached<EntryDetail>(
          `${API_URL}/content/${pageType}/entries/by-slug/${encodeURIComponent(saved.slug)}`,
          { cacheKey: `content:entry:${pageType}:${saved.slug}` },
        );
        setEntry(updated);
        setEditTitle(updated.title);
        setEditSlug(updated.slug);
        setSlugEdited(false);
        setLoadedUpdatedAt(updated.updated_at);
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
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
        <h1 className="font-rs-bold text-3xl text-primary leading-tight">{entry.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && !editMode && (
            <>
              <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)}>
                <History className="h-3.5 w-3.5 mr-1.5" />
                History
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                setEditTitle(entry.title);
                setEditSlug(entry.slug);
                setSlugEdited(false);
                latestBodyRef.current = entry.body;
                setEditMode(true);
              }}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </>
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
          {conflictDetected && (
            <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
              <span className="flex-1 text-foreground">
                <span className="font-semibold text-destructive">Edit conflict — </span>
                this entry was modified by someone else while you were editing.
              </span>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs"
                  onClick={() => handleSave(latestBodyRef.current, true)} disabled={saving}>
                  Save anyway
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                  onClick={async () => {
                    setConflictDetected(false); setSaveError(null); setEditMode(false);
                    cacheInvalidate(`content:entry:${pageType}:`);
                    const fresh = await fetchCached<EntryDetail>(
                      `${API_URL}/content/${pageType}/entries/by-slug/${encodeURIComponent(slug)}`,
                      { cacheKey: `content:entry:${pageType}:${slug}` },
                    );
                    setEntry(fresh); setEditTitle(fresh.title); setEditSlug(fresh.slug);
                    setSlugEdited(false); setLoadedUpdatedAt(fresh.updated_at);
                  }}
                  disabled={saving}>
                  Discard my changes
                </Button>
              </div>
            </div>
          )}
          <EntryEditor
            initialBody={entry.body}
            onSave={handleSave}
            onCancel={() => { setEditMode(false); setConflictDetected(false); }}
            saving={saving}
            onBodyChange={(b) => { latestBodyRef.current = b; }}
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

      {/* Export / copy actions */}
      {!editMode && entry.body && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => handleCopy("raw")}>
            {copied === "raw" ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copied === "raw" ? "Copied!" : "Copy Raw"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleCopy("discord")}>
            {copied === "discord" ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copied === "discord" ? "Copied!" : "Copy for Discord"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadMd(entry.title, entry.body)}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export .md
          </Button>
        </div>
      )}

      {entryId && (
        <VersionHistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          pageType={pageType}
          entryId={entryId}
          onRestored={async () => {
            cacheInvalidate(`content:entry:${pageType}:`);
            setHistoryOpen(false);
            const updated = await fetchCached<EntryDetail>(
              `${API_URL}/content/${pageType}/entries/by-slug/${encodeURIComponent(slug)}`,
              { cacheKey: `content:entry:${pageType}:${slug}` },
            );
            setEntry(updated);
            setEditTitle(updated.title);
            setEditSlug(updated.slug);
            setSlugEdited(false);
          }}
        />
      )}
    </div>
  );
}
