import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddTeam, useDeleteTeam, usePatchTeam } from "@/hooks/useFrenzy";
import type { FrenzyEventDetail } from "@/types/frenzy";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  event: FrenzyEventDetail;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Transforms OSRS wiki "File:" page URLs into direct image URLs.
// e.g. "File:Vorkath's_head_detail.png" or the full wiki page URL
// → "https://oldschool.runescape.wiki/images/Vorkath%27s_head_detail.png"
function normalizeIconUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  const match = s.match(/(?:^|\/w\/)File:(.+?)(?:\?|#|$)/i);
  if (match?.[1]) {
    const filename = decodeURIComponent(match[1]).replace(/ /g, "_");
    return `https://oldschool.runescape.wiki/images/${encodeURIComponent(filename).replace(/%2F/g, "/")}`;
  }
  return s;
}

interface EditState {
  name: string;
  icon_url: string;
}

function IconPreview({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);
  const normalized = normalizeIconUrl(url);
  if (!normalized) return null;
  return broken ? (
    <span className="text-xs text-destructive">Invalid image URL</span>
  ) : (
    <img
      src={normalized}
      alt="preview"
      className="h-7 w-7 rounded object-contain border"
      onError={() => setBroken(true)}
    />
  );
}

export function TeamManager({ event }: Props) {
  const addTeam = useAddTeam();
  const deleteTeam = useDeleteTeam();
  const patchTeam = usePatchTeam();

  const [newName, setNewName] = useState("");
  const [newIconUrl, setNewIconUrl] = useState("");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: "", icon_url: "" });

  function startEdit(team: FrenzyEventDetail["teams"][number]) {
    setEditingSlug(team.slug);
    setEditState({ name: team.name, icon_url: team.icon_url ?? "" });
  }

  function cancelEdit() {
    setEditingSlug(null);
  }

  async function handleSaveEdit(slug: string) {
    const name = editState.name.trim();
    if (!name) return;
    const icon_url = normalizeIconUrl(editState.icon_url) || null;
    try {
      await patchTeam.mutateAsync({ eventId: event.id, slug, data: { name, icon_url } });
      setEditingSlug(null);
      toast.success("Team updated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    const icon_url = normalizeIconUrl(newIconUrl) || null;
    try {
      await addTeam.mutateAsync({
        eventId: event.id,
        data: { name, slug: slugify(name), icon_url, sort_order: event.teams.length },
      });
      setNewName("");
      setNewIconUrl("");
      toast.success(`Team "${name}" added.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete(slug: string, name: string) {
    if (!confirm(`Remove team "${name}"? This will delete all their progress.`)) return;
    try {
      await deleteTeam.mutateAsync({ eventId: event.id, slug });
      toast.success("Team removed.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSortOrder(slug: string, order: number) {
    await patchTeam.mutateAsync({ eventId: event.id, slug, data: { sort_order: order } });
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Teams ({event.teams.length}/12)</h4>
      {event.teams.map((team, i) => (
        <div key={team.id} className="rounded-lg border bg-card p-2 space-y-1.5">
          {editingSlug === team.slug ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={editState.name}
                    onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                    className="h-7 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(team.slug);
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Icon URL</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={editState.icon_url}
                      onChange={(e) => setEditState((s) => ({ ...s, icon_url: e.target.value }))}
                      className="h-7 text-xs"
                      placeholder="https:// or File:Name.png"
                    />
                    <IconPreview url={editState.icon_url} />
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleSaveEdit(team.slug)}
                  disabled={!editState.name.trim() || patchTeam.isPending}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {team.icon_url ? (
                <img
                  src={team.icon_url}
                  alt={team.name}
                  className="h-8 w-8 rounded object-contain shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="h-8 w-8 rounded bg-muted shrink-0" />
              )}
              <span className="flex-1 font-medium text-sm">{team.name}</span>
              <span className="text-xs text-muted-foreground">{team.slug}</span>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => handleSortOrder(team.slug, i - 1)}>↑</Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === event.teams.length - 1} onClick={() => handleSortOrder(team.slug, i + 1)}>↓</Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(team)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(team.slug, team.name)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          {team.participants && team.participants.length > 0 && editingSlug !== team.slug && (
            <div className="flex flex-wrap gap-1 pl-1">
              {team.participants.map((rsn) => (
                <span key={rsn} className="text-xs bg-muted rounded px-1.5 py-0.5">{rsn}</span>
              ))}
            </div>
          )}
        </div>
      ))}
      {event.teams.length < 12 && (
        <div className="rounded-lg border border-dashed p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Add team</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Team name"
                className="h-7 text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div>
              <Label className="text-xs">Icon URL (optional)</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={newIconUrl}
                  onChange={(e) => setNewIconUrl(e.target.value)}
                  placeholder="https:// or File:Name.png"
                  className="h-7 text-xs"
                />
                <IconPreview url={newIconUrl} />
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleAdd} disabled={!newName.trim() || addTeam.isPending}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Team
          </Button>
        </div>
      )}
    </div>
  );
}
