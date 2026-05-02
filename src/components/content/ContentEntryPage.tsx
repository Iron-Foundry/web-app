import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import DOMPurify from "dompurify";
import { Check, Copy, Download, Heart, History, Pencil, Trash2 } from "lucide-react";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { EntryEditor } from "./EntryEditor";
import { useContentContext } from "./ContentLayout";
import { apiFetch } from "@/api/client";
import { VersionHistoryDialog } from "./VersionHistoryDialog";
import type { EntryAuthor, EntryDetail } from "@/types/content";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "";
}

function toDiscordMarkdown(body: string): string {
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

  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);
  const latestBodyRef = useRef<string>("");

  const [entryId, setEntryId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [reacted, setReacted] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);
  const [reacting, setReacting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setEditMode(false);
    setEntryId(null);
    apiFetch<EntryDetail>(
      `/content/${pageType}/entries/by-slug/${encodeURIComponent(slug)}`,
      { signal: controller.signal },
    )
      .then((data) => {
        setEntry(data);
        setEntryId(data.id);
        setEditTitle(data.title);
        setEditSlug(data.slug);
        setSlugEdited(false);
        setLoadedUpdatedAt(data.updated_at);
        setConflictDetected(false);
        setReacted(data.user_has_reacted ?? false);
        setReactionCount(data.reaction_count ?? 0);
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
          ...getAuthHeaders(),
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
      setEditMode(false);
      refreshTree();
      if (saved.slug !== slug) {
        navigate({ to: `${routeBase}/$slug`, params: { slug: saved.slug } });
      } else {
        const updated = await apiFetch<EntryDetail>(
          `/content/${pageType}/entries/by-slug/${encodeURIComponent(saved.slug)}`,
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
    try {
      await fetch(`${API_URL}/content/${pageType}/entries/${entryId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      refreshTree();
      navigate({ to: routeBase });
    } catch {
    }
  }

  async function handleReact() {
    if (!entryId || !user || reacting) return;
    const prevReacted = reacted;
    const prevCount = reactionCount;
    setReacted(!reacted);
    setReactionCount(reacted ? reactionCount - 1 : reactionCount + 1);
    setReacting(true);
    try {
      const res = await fetch(`${API_URL}/content/${pageType}/entries/${entryId}/react`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setReacted(prevReacted);
        setReactionCount(prevCount);
        return;
      }
      const data = await res.json() as { reacted: boolean; count: number };
      setReacted(data.reacted);
      setReactionCount(data.count);
    } catch {
      setReacted(prevReacted);
      setReactionCount(prevCount);
    } finally {
      setReacting(false);
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

      {saveError && <p className="text-xs text-destructive">{saveError}</p>}

      {editMode ? (
        <div className="space-y-4">
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
                    const fresh = await apiFetch<EntryDetail>(
                      `/content/${pageType}/entries/by-slug/${encodeURIComponent(slug)}`,
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
        <div className="min-h-25">
          {entry.body ? (
            <MarkdownRenderer body={entry.body} />
          ) : (
            <p className="text-muted-foreground text-sm italic">No content yet.</p>
          )}
        </div>
      )}

      {!editMode && (entry.author || entry.created_at || entry.updated_at) && (
        <div className="mt-8 pt-4 border-t border-border flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          {entry.created_at && (
            <div className="flex items-center gap-1.5">
              <span>Created</span>
              <span className="text-foreground">{new Date(entry.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
              {entry.author && (
                <>
                  <span>by</span>
                  <AuthorChip user={entry.author} />
                </>
              )}
            </div>
          )}
          {entry.updated_at && entry.updated_at !== entry.created_at && (
            <div className="flex items-center gap-1.5">
              <span>Last updated</span>
              <span className="text-foreground">{new Date(entry.updated_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
              {entry.last_updated_by && (
                <>
                  <span>by</span>
                  <AuthorChip user={entry.last_updated_by} />
                </>
              )}
            </div>
          )}
        </div>
      )}
      


      {!editMode && (
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={handleReact}
              disabled={reacting}
              title={reacted ? "Remove reaction" : "Mark as useful"}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <Heart
                className="h-4 w-4 shrink-0 transition-colors"
                style={reacted ? { fill: "currentColor", color: "rgb(239 68 68)" } : {}}
              />
              <span className="tabular-nums">{reactionCount}</span>
            </button>
          ) : (
            <span title="Log in to react" className="flex items-center gap-1.5 px-2.5 py-1 text-sm text-muted-foreground cursor-default">
              <Heart className="h-4 w-4 shrink-0" />
              <span className="tabular-nums">{reactionCount}</span>
            </span>
          )}
        </div>
      )}

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
            const updated = await apiFetch<EntryDetail>(
              `/content/${pageType}/entries/by-slug/${encodeURIComponent(slug)}`,
            );
            setEntry(updated);
            setEntryId(updated.id);
            setEditTitle(updated.title);
            setEditSlug(updated.slug);
            setSlugEdited(false);
            setLoadedUpdatedAt(updated.updated_at);
          }}
        />
      )}
    </div>
  );
}
