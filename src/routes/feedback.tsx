import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FeedbackCard, type FeedbackItem } from "@/components/feedback/FeedbackCard";
import { FeedbackArchiveSection } from "@/components/feedback/FeedbackArchiveSection";
import { SubmitFeedbackDialog } from "@/components/feedback/SubmitFeedbackDialog";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";

export const feedbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feedback",
  component: FeedbackBoardPage,
});

type TabType = "suggestion" | "bug";

const ARCHIVED_STATUSES: Record<TabType, Set<string>> = {
  suggestion: new Set(["implemented", "wont-add"]),
  bug: new Set(["patched", "wont-fix"]),
};

const STATUS_ORDER: Record<string, number> = {
  "needs-triage": 0,
  "open":         1,
  "reviewing":    2,
  "planned":      3,
};

function sortActive(items: FeedbackItem[]): FeedbackItem[] {
  return [...items].sort((a, b) => {
    const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    const aTime = a.last_reply_at ?? a.created_at;
    const bTime = b.last_reply_at ?? b.created_at;
    return bTime.localeCompare(aTime);
  });
}

function FeedbackBoardPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const canPin = hasPermission("staff.feedback", "edit", effectiveRoles);

  const [tab, setTab] = useState<TabType>("suggestion");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const headers = user ? getAuthHeaders() : {};
    fetch(`${API_URL}/feedback?type=${tab}`, { headers })
      .then((r) => (r.ok ? (r.json() as Promise<FeedbackItem[]>) : Promise.reject()))
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab, user]);

  function handleSubmitted(item: FeedbackItem) {
    if (item.type === tab) {
      setItems((prev) => [item, ...prev]);
    }
  }

  function handleStatusChange(id: number, status: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  async function handleHeart(id: number) {
    if (!user) return;
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

  const archived = ARCHIVED_STATUSES[tab];
  const activeItems = sortActive(items.filter((i) => !archived.has(i.status)));
  const archivedItems = items.filter((i) => archived.has(i.status));

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Feedback Board</h1>
        <p className="text-sm text-muted-foreground">
          Community suggestions and bug reports.
          {!user && " Log in to submit or react."}
        </p>
      </div>

      <Separator />

      {/* Tab selector + actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={tab === "suggestion" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("suggestion")}
            className={cn(tab !== "suggestion" && "text-muted-foreground")}
          >
            Suggestions
          </Button>
          <Button
            variant={tab === "bug" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("bug")}
            className={cn(tab !== "bug" && "text-muted-foreground")}
          >
            Bug Reports
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <SubmitFeedbackDialog type={tab} onSubmitted={handleSubmitted} />
          )}
          {!loading && (
            <FeedbackArchiveSection
              items={archivedItems}
              label="Resolved"
              onHeart={handleHeart}
              onStatusChange={handleStatusChange}
              canHeart={!!user}
              canReply={!!user}
              canPin={canPin}
              canEditStatus={canPin}
            />
          )}
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!loading && activeItems.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No {tab === "suggestion" ? "suggestions" : "bug reports"} yet.
        </p>
      )}

      {!loading && activeItems.length > 0 && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {activeItems.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              onHeart={handleHeart}
              onStatusChange={handleStatusChange}
              canHeart={!!user}
              canReply={!!user}
              canPin={canPin}
              canEditStatus={canPin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
