import { useEffect, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { registerPage } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, UserPlus, UserMinus, Upload } from "lucide-react";
import { hasMinRank } from "@/lib/ranks";

registerPage({
  id: "staff.badges",
  label: "Staff — Badges",
  description: "Create and assign profile badges to members.",
  defaults: { read: ["Mentor"], create: ["Mentor"], edit: ["Mentor"], delete: ["Senior Moderator"] },
});

export const staffBadgesRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/badges",
  component: BadgesPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface BadgeEntry {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  color: string;
  text_color: string;
  created_at: string | null;
}

interface BadgeMember {
  discord_user_id: number;
  username: string;
  rsn: string | null;
  assigned_at: string | null;
}

// ── Badge preview ─────────────────────────────────────────────────────────────

function BadgePreview({ badge, size = "md" }: { badge: Partial<BadgeEntry>; size?: "sm" | "md" | "lg" }) {
  const isSvg = badge.icon?.trimStart().startsWith("<");
  const sizeClass = size === "sm" ? "h-7 px-2 gap-1 text-xs" : size === "lg" ? "h-12 px-4 gap-2 text-base" : "h-9 px-3 gap-1.5 text-sm";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4 w-4";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium shrink-0 ${sizeClass}`}
      style={{
        background: badge.color || "#6366f1",
        color: badge.text_color || "#ffffff",
      }}
    >
      {badge.icon && (
        isSvg ? (
          <span
            className={`${iconSize} shrink-0`}
            dangerouslySetInnerHTML={{ __html: badge.icon }}
            style={{ color: badge.text_color || "#ffffff" }}
          />
        ) : (
          <img src={badge.icon} alt="" className={`${iconSize} shrink-0 object-contain`} />
        )
      )}
      {badge.name || "Badge name"}
    </span>
  );
}

// ── Editor dialog ─────────────────────────────────────────────────────────────

const GRADIENT_PRESETS = [
  { label: "Indigo",   value: "#6366f1" },
  { label: "Gold",     value: "linear-gradient(135deg, #f59e0b, #d97706)" },
  { label: "Emerald",  value: "linear-gradient(135deg, #10b981, #059669)" },
  { label: "Rose",     value: "linear-gradient(135deg, #f43f5e, #e11d48)" },
  { label: "Sky",      value: "linear-gradient(135deg, #0ea5e9, #0284c7)" },
  { label: "Purple",   value: "linear-gradient(135deg, #a855f7, #7c3aed)" },
  { label: "Sunset",   value: "linear-gradient(135deg, #f97316, #ec4899)" },
  { label: "Ocean",    value: "linear-gradient(135deg, #06b6d4, #6366f1)" },
];

function BadgeEditorDialog({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: BadgeEntry | null;
  onClose: () => void;
  onSaved: (b: BadgeEntry) => void;
}) {
  const token = getAuthToken();
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [color, setColor] = useState("#6366f1");
  const [textColor, setTextColor] = useState("#ffffff");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setIcon(initial?.icon ?? null);
      setColor(initial?.color ?? "#6366f1");
      setTextColor(initial?.text_color ?? "#ffffff");
      setError(null);
    }
  }, [open, initial]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    if (file.type === "image/svg+xml") {
      reader.onload = () => setIcon(reader.result as string);
      reader.readAsText(file);
    } else {
      reader.onload = () => setIcon(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSave() {
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const url = initial ? `${API_URL}/badges/${initial.id}` : `${API_URL}/badges`;
      const method = initial ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify({ name, description, icon, color, text_color: textColor }),
      });
      if (!r.ok) { setError(`Error ${r.status}`); return; }
      const data = await r.json() as BadgeEntry;
      onSaved(data);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  const preview: Partial<BadgeEntry> = { name, icon, color, text_color: textColor };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg space-y-4">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Badge" : "New Badge"}</DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <BadgePreview badge={preview} size="lg" />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Badge name" className="mt-1" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this badge for?" className="mt-1 resize-none" rows={2} />
          </div>

          {/* Icon upload */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Icon (SVG or PNG)</label>
            <div className="mt-1 flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload
              </Button>
              {icon && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setIcon(null)}>
                  Remove
                </Button>
              )}
              <input ref={fileRef} type="file" accept=".svg,.png,image/svg+xml,image/png" className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Background color / gradient</label>
            <div className="mt-1 flex flex-wrap gap-1.5 mb-2">
              {GRADIENT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  title={p.label}
                  onClick={() => setColor(p.value)}
                  className="h-6 w-6 rounded-full border-2 transition-all"
                  style={{
                    background: p.value,
                    borderColor: color === p.value ? "white" : "transparent",
                    boxShadow: color === p.value ? "0 0 0 1px #6366f1" : undefined,
                  }}
                />
              ))}
            </div>
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. #6366f1 or linear-gradient(135deg, #f59e0b, #d97706)"
              className="font-mono text-xs"
            />
          </div>

          {/* Text color */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Text color</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Assign dialog ─────────────────────────────────────────────────────────────

interface MemberSuggestion {
  discord_user_id: number;
  discord_username: string;
  rsn: string | null;
}

function AssignDialog({
  badge,
  open,
  onClose,
}: {
  badge: BadgeEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  const token = getAuthToken();
  const authHeaders = (extra?: object) => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...extra,
  });

  const [members, setMembers] = useState<BadgeMember[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MemberSuggestion[]>([]);
  const [selected, setSelected] = useState<MemberSuggestion | null>(null);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing badge members when dialog opens
  useEffect(() => {
    if (!open || !badge) return;
    setLoadingMembers(true);
    setQuery("");
    setSuggestions([]);
    setSelected(null);
    setError(null);
    fetch(`${API_URL}/badges/${badge.id}/members`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() as Promise<BadgeMember[]> : Promise.resolve([]))
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoadingMembers(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, badge]);

  // Debounced member search
  useEffect(() => {
    if (selected) return; // already picked someone
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${API_URL}/staff/members?search=${encodeURIComponent(q)}`, {
          headers: authHeaders(),
        });
        if (r.ok) {
          const list = await r.json() as MemberSuggestion[];
          // filter out already-assigned members
          const assignedIds = new Set(members.map((m) => m.discord_user_id));
          setSuggestions(list.filter((s) => !assignedIds.has(s.discord_user_id)).slice(0, 8));
        }
      } catch { /* ignore */ } finally {
        setSearching(false);
      }
    }, 250);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selected, members]);

  function handleSelect(s: MemberSuggestion) {
    setSelected(s);
    setQuery(s.rsn ?? s.discord_username);
    setSuggestions([]);
  }

  function handleClear() {
    setSelected(null);
    setQuery("");
    setSuggestions([]);
    setError(null);
  }

  async function handleAssign() {
    if (!badge || !selected) return;
    setAssigning(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/badges/${badge.id}/assign`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ discord_user_id: selected.discord_user_id }),
      });
      if (r.ok) {
        setMembers((prev) => [
          ...prev,
          { discord_user_id: selected.discord_user_id, username: selected.discord_username, rsn: selected.rsn, assigned_at: new Date().toISOString() },
        ]);
        handleClear();
      } else {
        const data = await r.json().catch(() => ({})) as { detail?: string };
        setError(data.detail ?? `Error ${r.status}`);
      }
    } catch {
      setError("Network error.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleRevoke(userId: number) {
    if (!badge) return;
    await fetch(`${API_URL}/badges/${badge.id}/assign/${userId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    setMembers((prev) => prev.filter((m) => m.discord_user_id !== userId));
  }

  if (!badge) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Assign — <BadgePreview badge={badge} size="sm" />
          </DialogTitle>
        </DialogHeader>

        {/* Search + assign row */}
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); if (selected) setSelected(null); }}
                placeholder="Search by RSN or username…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selected) handleAssign();
                  if (e.key === "Escape") handleClear();
                }}
                autoComplete="off"
              />
              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
                  {suggestions.map((s) => (
                    <li key={s.discord_user_id}>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                        onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                      >
                        <span className="font-medium text-foreground">{s.rsn ?? s.discord_username}</span>
                        {s.rsn && <span className="text-xs text-muted-foreground">{s.discord_username}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {searching && !suggestions.length && query.trim() && !selected && (
                <p className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-md">
                  Searching…
                </p>
              )}
            </div>
            <Button onClick={handleAssign} disabled={assigning || !selected} size="sm">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <Separator />

        {loadingMembers ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members assigned yet.</p>
        ) : (
          <ul className="space-y-1.5 max-h-60 overflow-y-auto">
            {members.map((m) => (
              <li key={m.discord_user_id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
                <div>
                  <span className="text-sm font-medium text-foreground">{m.rsn ?? m.username}</span>
                  {m.rsn && <span className="ml-2 text-xs text-muted-foreground">{m.username}</span>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRevoke(m.discord_user_id)}>
                  <UserMinus className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function BadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BadgeEntry | null>(null);
  const [assignTarget, setAssignTarget] = useState<BadgeEntry | null>(null);

  const token = getAuthToken();
  const authHeaders = { Authorization: `Bearer ${token}` };

  const isSeniorMod = user ? hasMinRank(user.effective_roles, "Senior Moderator") : false;

  useEffect(() => {
    fetch(`${API_URL}/badges`, { headers: authHeaders })
      .then((r) => r.ok ? r.json() as Promise<BadgeEntry[]> : Promise.resolve([]))
      .then(setBadges)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(b: BadgeEntry) {
    setBadges((prev) => {
      const idx = prev.findIndex((x) => x.id === b.id);
      return idx >= 0 ? prev.with(idx, b) : [...prev, b];
    });
    setEditorOpen(false);
    setEditTarget(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this badge? It will be removed from all members.")) return;
    const r = await fetch(`${API_URL}/badges/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (r.ok) setBadges((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Badges</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and assign profile badges to members.</p>
        </div>
        <Button onClick={() => { setEditTarget(null); setEditorOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New badge
        </Button>
      </div>

      <Separator />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : badges.length === 0 ? (
        <p className="text-sm text-muted-foreground">No badges created yet.</p>
      ) : (
        <div className="space-y-3">
          {badges.map((b) => (
            <div key={b.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
              <BadgePreview badge={b} />
              <div className="flex-1 min-w-0">
                {b.description && (
                  <p className="text-xs text-muted-foreground truncate">{b.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setAssignTarget(b)}>
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Assign
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTarget(b); setEditorOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {isSeniorMod && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(b.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <BadgeEditorDialog
        open={editorOpen}
        initial={editTarget}
        onClose={() => { setEditorOpen(false); setEditTarget(null); }}
        onSaved={handleSaved}
      />

      <AssignDialog
        badge={assignTarget}
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
      />
    </div>
  );
}
