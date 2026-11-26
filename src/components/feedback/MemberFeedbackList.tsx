import { useEffect, useState } from "react";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { PageHead } from "@/components/layout/PageHead";
import type { FeedbackType } from "@/lib/feedbackDraft";
import { FeedbackCard, type FeedbackItem } from "./FeedbackCard";
import { EditFeedbackDialog } from "./EditFeedbackDialog";

const COPY: Record<FeedbackType, { title: string; lede: string; list: string; empty: string }> = {
  suggestion: { title: "Suggestions", lede: "Share ideas to improve the clan.", list: "All Suggestions", empty: "No suggestions yet. Be the first!" },
  bug: { title: "Bug Reports", lede: "Report issues and bugs you encounter.", list: "All Bug Reports", empty: "No bug reports yet." },
};

type ListState = { kind: "loading" } | { kind: "failed" } | { kind: "ready" };

/** The members' list of suggestions or bug reports: hearts, replies, staff status, and Edit on your own open post. */
export function MemberFeedbackList({ type }: { type: FeedbackType }): React.ReactElement {
  const copy = COPY[type];
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canPin = hasPermission("staff.feedback", "edit", useEffectiveRoles(user?.effective_roles ?? []));
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [state, setState] = useState<ListState>({ kind: "loading" });
  const [editing, setEditing] = useState<FeedbackItem | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/feedback?type=${type}`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? (r.json() as Promise<FeedbackItem[]>) : Promise.reject(new Error(`${r.status}`))))
      .then((list) => { setItems(list); setState({ kind: "ready" }); }, () => setState({ kind: "failed" }));
  }, [type]);

  const replace = (updated: FeedbackItem): void => setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));

  async function handleHeart(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/feedback/${id}/react`, { method: "POST", headers: getAuthHeaders() });
    if (!res.ok) return;
    const data = (await res.json()) as { hearted: boolean; heart_count: number };
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_hearted: data.hearted, heart_count: data.heart_count } : i)));
  }

  return (
    <div className="space-y-6">
      <PageHead title={copy.title} lede={copy.lede} />
      <h2 className="font-rs-bold text-xl">{copy.list}</h2>
      {state.kind === "loading" && <p className="text-sm text-muted-foreground">Loading...</p>}
      {state.kind === "failed" && <p className="text-sm text-destructive">The list could not be loaded. Try again later.</p>}
      {state.kind === "ready" && items.length === 0 && <p className="text-sm text-muted-foreground">{copy.empty}</p>}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              onHeart={handleHeart}
              onEdit={(id) => setEditing(items.find((i) => i.id === id) ?? null)}
              onStatusChange={(id, status) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))}
              canHeart
              canReply
              canPin={canPin}
              canEditStatus={canPin}
            />
          ))}
        </div>
      )}
      {editing && <EditFeedbackDialog item={editing} onSaved={replace} onClose={() => setEditing(null)} />}
    </div>
  );
}
