import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { membersLayoutRoute } from "./_layout";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FeedbackCard, type FeedbackItem, type FeedbackAttachment } from "@/components/feedback/FeedbackCard";
import { AttachmentUploader } from "@/components/feedback/AttachmentUploader";
import { registerPage } from "@/lib/permissions";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";

registerPage({
  id: "members.bugs",
  label: "Bug Reports",
  description: "Submit and view bug reports.",
  defaults: { read: [], create: [], edit: [], delete: [] },
});

export const membersBugsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/bugs",
  component: BugsPage,
});

interface EditState {
  title: string;
  description: string;
  steps_to_reproduce: string;
  is_anonymous: string;
  attachments: FeedbackAttachment[];
}

function BugsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const canPin = hasPermission("staff.feedback", "edit", effectiveRoles);

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState>({
    title: "",
    description: "",
    steps_to_reproduce: "",
    is_anonymous: "no",
    attachments: [],
  });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/feedback?type=bug`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? (r.json() as Promise<FeedbackItem[]>) : Promise.reject()))
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleStatusChange(id: number, status: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  function openEdit(id: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setEditingId(id);
    setEditState({
      title: item.title,
      description: item.description,
      steps_to_reproduce: item.extra.steps_to_reproduce ?? "",
      is_anonymous: item.is_anonymous ? "yes" : "no",
      attachments: item.attachments ?? [],
    });
  }

  async function handleSaveEdit() {
    if (!editingId || !editState.title.trim() || !editState.steps_to_reproduce.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`${API_URL}/feedback/${editingId}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editState.title.trim(),
          description: editState.description.trim(),
          steps_to_reproduce: editState.steps_to_reproduce.trim(),
          is_anonymous: editState.is_anonymous === "yes",
          attachment_ids: editState.attachments.map((a) => a.id),
        }),
      });
      if (res.ok) {
        const updated = await res.json() as FeedbackItem;
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
        setEditingId(null);
        toast.success("Bug report updated.");
      } else {
        toast.error("Failed to save changes.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleHeart(id: number) {
    const res = await fetch(`${API_URL}/feedback/${id}/react`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json() as { hearted: boolean; heart_count: number };
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, is_hearted: data.hearted, heart_count: data.heart_count } : i,
        ),
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Bug Reports</h1>
        <p className="text-sm text-muted-foreground">Report issues and bugs you encounter.</p>
      </div>

      <Separator />

      <h2 className="text-sm font-semibold">All Bug Reports</h2>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">No bug reports yet.</p>
      )}

      {!loading && items.length > 0 && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) =>
            editingId === item.id ? (
              <div key={item.id} className="col-span-full border rounded-lg p-4 space-y-3 max-w-2xl">
                <h3 className="text-sm font-semibold">Edit Bug Report</h3>
                <Input
                  value={editState.title}
                  onChange={(e) => setEditState((s) => ({ ...s, title: e.target.value }))}
                  maxLength={200}
                />
                <Textarea
                  placeholder="Description..."
                  value={editState.description}
                  onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
                  rows={3}
                  maxLength={4000}
                />
                <Textarea
                  placeholder="Steps to reproduce..."
                  value={editState.steps_to_reproduce}
                  onChange={(e) => setEditState((s) => ({ ...s, steps_to_reproduce: e.target.value }))}
                  rows={3}
                  maxLength={4000}
                />
                <AttachmentUploader
                  attachments={editState.attachments}
                  onChange={(a) => setEditState((s) => ({ ...s, attachments: a }))}
                  disabled={editSaving}
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Anonymous?</span>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={editState.is_anonymous}
                    onValueChange={(v) => { if (v) setEditState((s) => ({ ...s, is_anonymous: v })); }}
                  >
                    <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
                    <ToggleGroupItem value="no">No</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} disabled={editSaving}>
                    {editSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <FeedbackCard
                key={item.id}
                item={item}
                onHeart={handleHeart}
                onEdit={openEdit}
                onStatusChange={handleStatusChange}
                canHeart
                canReply
                canPin={canPin}
                canEditStatus={canPin}
              />
            ),
          )}
        </div>
      )}

    </div>
  );
}
