import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import DOMPurify from "dompurify";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/api/client";
import type { EntryDetail } from "@/types/content";

export function toDiscordMarkdown(body: string): string {
  const safe = DOMPurify.sanitize(body, { ALLOWED_TAGS: ["kbd", "br"], ALLOWED_ATTR: [] });
  return safe
    .replace(/<kbd>(.*?)<\/kbd>/gi, (_, t) => `\`${t}\``)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$2");
}

export function downloadMd(title: string, body: string): void {
  const filename = title.trim().replace(/[^a-z0-9\s-]/gi, "").replace(/\s+/g, "-").replace(/-+/g, "-").toLowerCase() + ".md";
  const blob = new Blob([body], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function useContentEntry(slug: string, pageType: string, canEdit: boolean, routeBase: string, refreshTree: () => void) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);
  const latestBodyRef = useRef<string>("");
  const [entryId, setEntryId] = useState<string | null>(null);

  const [reacted, setReacted] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);
  const [reacting, setReacting] = useState(false);

  const [copied, setCopied] = useState<"raw" | "discord" | null>(null);

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
      .catch((e: Error) => { if (e.name !== "AbortError") setError(e.message); })
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
      if (!skipConflictCheck) payload.expected_updated_at = loadedUpdatedAt;

      const res = await fetch(`${API_URL}/content/${pageType}/entries/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 && data.detail === "edit_conflict") { setConflictDetected(true); return; }
        setSaveError(data.detail ?? "Failed to save.");
        return;
      }
      const saved = await res.json() as { slug: string; updated_at: string | null };
      setEditMode(false);
      refreshTree();
      if (saved.slug !== slug) {
        navigate({ to: `${routeBase}/$slug`, params: { slug: saved.slug } });
      } else {
        const updated = await apiFetch<EntryDetail>(`/content/${pageType}/entries/by-slug/${encodeURIComponent(saved.slug)}`);
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
    } catch { /* swallow */ }
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
      if (!res.ok) { setReacted(prevReacted); setReactionCount(prevCount); return; }
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

  function handleCopy(variant: "raw" | "discord") {
    if (!entry) return;
    const text = variant === "discord" ? toDiscordMarkdown(entry.body) : entry.body;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(variant);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function discardChanges() {
    setConflictDetected(false);
    setSaveError(null);
    setEditMode(false);
    const fresh = await apiFetch<EntryDetail>(`/content/${pageType}/entries/by-slug/${encodeURIComponent(slug)}`);
    setEntry(fresh);
    setEditTitle(fresh.title);
    setEditSlug(fresh.slug);
    setSlugEdited(false);
    setLoadedUpdatedAt(fresh.updated_at);
  }

  async function onRestored() {
    const updated = await apiFetch<EntryDetail>(`/content/${pageType}/entries/by-slug/${encodeURIComponent(slug)}`);
    setEntry(updated);
    setEntryId(updated.id);
    setEditTitle(updated.title);
    setEditSlug(updated.slug);
    setSlugEdited(false);
    setLoadedUpdatedAt(updated.updated_at);
  }

  return {
    entry, loading, error,
    editMode, setEditMode,
    editTitle, setEditTitle,
    editSlug, setEditSlug,
    slugEdited, setSlugEdited,
    saving, saveError,
    conflictDetected,
    latestBodyRef,
    entryId,
    reacted, reactionCount, reacting,
    copied,
    handleSave, handleDelete, handleReact, handleCopy, discardChanges, onRestored,
  };
}
