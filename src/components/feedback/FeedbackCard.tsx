import { useState } from "react";
import { Heart, MessageSquare, ChevronDown, ChevronUp, Pin } from "lucide-react";
import { shineHandlers } from "@/hooks/useShineEffect";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import type { FeedbackDetailItem, FeedbackItem, FeedbackReply } from "./feedbackTypes";
import { BUG_STATUSES, SUGGESTION_STATUSES, relativeTime, statusBadge } from "./feedbackStatus";
import { AttachmentGrid, RankBadge } from "./FeedbackParts";
import { ReplyThread } from "./ReplyThread";

export type { FeedbackAttachment, FeedbackItem, FeedbackReply } from "./feedbackTypes";

interface FeedbackCardProps {
  item: FeedbackItem;
  onHeart?: (id: number) => void;
  onEdit?: (id: number) => void;
  onStatusChange?: (id: number, status: string) => void;
  canHeart?: boolean;
  canReply?: boolean;
  canPin?: boolean;
  canEditStatus?: boolean;
}

export function FeedbackCard({ item, onHeart, onEdit, onStatusChange, canHeart = false, canReply = false, canPin = false, canEditStatus = false }: FeedbackCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [loadedReplies, setLoadedReplies] = useState<FeedbackReply[] | null>(null);
  const [livePinnedReply, setLivePinnedReply] = useState<FeedbackReply | null>(item.pinned_reply);
  const [liveReplyCount, setLiveReplyCount] = useState(item.reply_count);
  const [liveStatus, setLiveStatus] = useState(item.status);
  const [savingStatus, setSavingStatus] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setSavingStatus(true);
    try {
      const res = await fetch(`${API_URL}/feedback/${item.id}/status`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLiveStatus(newStatus);
        onStatusChange?.(item.id, newStatus);
      }
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleToggleReplies() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (loadedReplies === null) {
      setLoadingReplies(true);
      try {
        const headers = canReply || canPin ? getAuthHeaders() : {};
        const res = await fetch(`${API_URL}/feedback/${item.id}`, { headers });
        if (res.ok) {
          const detail = await res.json() as FeedbackDetailItem;
          setLoadedReplies(detail.replies ?? []);
          setLivePinnedReply(detail.pinned_reply);
        }
      } catch {
        setLoadedReplies([]);
      } finally {
        setLoadingReplies(false);
      }
    }
    setExpanded(true);
  }

  function handleNewReply(reply: FeedbackReply) {
    setLoadedReplies((prev) => [...(prev ?? []), reply]);
    setLiveReplyCount((n) => n + 1);
  }

  function handlePinnedChange(reply: FeedbackReply | null) {
    setLivePinnedReply(reply);
    // Update pinned state in loaded replies list
    setLoadedReplies((prev) => {
      if (!prev) return prev;
      return prev.map((r) => ({ ...r, is_pinned: reply?.id === r.id }));
    });
  }

  const replyButtonLabel = loadingReplies
    ? "Loading..."
    : expanded
    ? "Hide replies"
    : liveReplyCount > 0
    ? `${liveReplyCount} ${liveReplyCount === 1 ? "reply" : "replies"}`
    : canReply
    ? "Reply"
    : "No replies";

  return (
    <div className="shine-border rounded-xl" {...shineHandlers}>
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h3 className="font-rs-bold text-base text-primary leading-tight flex-1 min-w-0">
            {item.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {canEditStatus ? (
              <Select value={liveStatus} onValueChange={handleStatusChange} disabled={savingStatus}>
                <SelectTrigger className="h-6 text-xs px-2 py-0 w-auto gap-1 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(item.type === "suggestion" ? SUGGESTION_STATUSES : BUG_STATUSES).map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              statusBadge(liveStatus)
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {item.is_anonymous ? "Anonymous" : (item.author_name ?? "Anonymous")} &middot; {relativeTime(item.created_at)}
        </p>
      </CardHeader>

      <CardContent className="pt-0 flex flex-col flex-1 gap-3">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>

        {item.extra.steps_to_reproduce && (
          <div className="rounded-md border bg-muted/40 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Steps to reproduce</p>
            <p className="text-sm whitespace-pre-wrap">{item.extra.steps_to_reproduce}</p>
          </div>
        )}

        <AttachmentGrid attachments={item.attachments ?? []} />

        {/* Pinned reply preview when thread is collapsed */}
        {!expanded && livePinnedReply && (
          <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 space-y-1">
            <div className="flex items-center gap-1.5">
              <Pin className="h-3 w-3 text-primary/60 shrink-0" />
              <RankBadge clanRank={livePinnedReply.author_clan_rank} />
              <span className="text-xs text-muted-foreground">
                {livePinnedReply.author_name ?? "Staff"}
              </span>
            </div>
            <p className="text-sm line-clamp-2">{livePinnedReply.body}</p>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-1 mt-auto pt-1 flex-wrap">
          <button
            onClick={() => canHeart && onHeart?.(item.id)}
            disabled={!canHeart}
            className={cn(
              "flex items-center gap-1 text-xs rounded-md px-2 py-1 transition-colors",
              canHeart
                ? "hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
                : "cursor-default text-muted-foreground/60",
              item.is_hearted && canHeart && "text-rose-500 hover:text-rose-600",
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", item.is_hearted && canHeart && "fill-current")} />
            {item.heart_count}
          </button>

          <button
            onClick={handleToggleReplies}
            disabled={loadingReplies}
            className="flex items-center gap-1 text-xs rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {replyButtonLabel}
            {!loadingReplies && (
              expanded
                ? <ChevronUp className="h-3 w-3 ml-0.5" />
                : <ChevronDown className="h-3 w-3 ml-0.5" />
            )}
          </button>

          {item.is_own && liveStatus === "open" && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 text-xs px-2"
              onClick={() => onEdit(item.id)}
            >
              Edit
            </Button>
          )}
        </div>

        {/* Inline reply thread */}
        {expanded && (
          <>
            <Separator />
            <ReplyThread
              itemId={item.id}
              pinnedReply={livePinnedReply}
              initialReplies={loadedReplies ?? []}
              canReply={canReply}
              canPin={canPin}
              onNewReply={handleNewReply}
              onPinnedChange={handlePinnedChange}
            />
          </>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
