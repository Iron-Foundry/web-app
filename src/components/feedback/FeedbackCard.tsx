import { useState } from "react";
import { Heart, MessageSquare, ChevronDown, ChevronUp, Send, Pin, PinOff } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { INGAME_TO_DISPLAY, ROLE_BADGE_CLASS } from "@/lib/ranks";

export interface FeedbackAttachment {
  id: string;
  url: string;
  original_name: string;
  content_type: string;
}

export interface FeedbackReply {
  id: number;
  feedback_id: number;
  body: string;
  is_pinned: boolean;
  author_name: string | null;
  author_discord_id: number | null;
  author_clan_rank: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackItem {
  id: number;
  type: "suggestion" | "bug";
  title: string;
  description: string;
  extra: { steps_to_reproduce?: string };
  status: string;
  is_anonymous: boolean;
  author_name: string | null;
  author_discord_id: number | null;
  is_own: boolean;
  heart_count: number;
  is_hearted: boolean;
  reply_count: number;
  last_reply_at: string | null;
  pinned_reply: FeedbackReply | null;
  attachments: FeedbackAttachment[];
  created_at: string;
  updated_at: string;
}

interface FeedbackDetailItem extends FeedbackItem {
  replies: FeedbackReply[];
}

const SUGGESTION_STATUSES = [
  { value: "open",          label: "Open" },
  { value: "needs-triage",  label: "Needs Triage" },
  { value: "planned",       label: "Planned" },
  { value: "implemented",   label: "Implemented" },
  { value: "wont-add",      label: "Won't Add" },
] as const;

const BUG_STATUSES = [
  { value: "open",          label: "Open" },
  { value: "needs-triage",  label: "Needs Triage" },
  { value: "reviewing",     label: "Reviewing" },
  { value: "planned",       label: "Planned" },
  { value: "patched",       label: "Patched" },
  { value: "wont-fix",      label: "Won't Fix" },
] as const;

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

const STATUS_LABEL: Record<string, string> = {
  "open":         "Open",
  "needs-triage": "Needs Triage",
  "planned":      "Planned",
  "implemented":  "Implemented",
  "wont-add":     "Won't Add",
  "reviewing":    "Reviewing",
  "patched":      "Patched",
  "wont-fix":     "Won't Fix",
};

export function statusBadge(status: string) {
  const label = STATUS_LABEL[status] ?? status;
  switch (status) {
    case "open":
      return <Badge variant="default" className="text-xs">{label}</Badge>;
    case "needs-triage":
      return <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">{label}</Badge>;
    case "planned":
      return <Badge variant="outline" className="text-xs border-blue-500 text-blue-600 dark:text-blue-400">{label}</Badge>;
    case "reviewing":
      return <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">{label}</Badge>;
    case "implemented":
    case "patched":
      return <Badge variant="outline" className="text-xs border-green-500 text-green-600 dark:text-green-400">{label}</Badge>;
    case "wont-add":
    case "wont-fix":
      return <Badge variant="destructive" className="text-xs">{label}</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{label}</Badge>;
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function AttachmentGrid({ attachments }: { attachments: FeedbackAttachment[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (attachments.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => (
          <button
            key={a.id}
            onClick={() => setLightbox(`${API_URL}${a.url}`)}
            className="relative overflow-hidden rounded-md border bg-muted/40 hover:opacity-80 transition-opacity"
          >
            <img
              src={`${API_URL}${a.url}`}
              alt={a.original_name}
              className="h-20 w-20 object-cover"
            />
          </button>
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Attachment"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function RankBadge({ clanRank }: { clanRank: string | null }) {
  if (!clanRank) return null;
  const displayRole = INGAME_TO_DISPLAY[clanRank];
  const roleClass = displayRole ? ROLE_BADGE_CLASS[displayRole] : null;
  if (displayRole && roleClass) {
    return (
      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", roleClass)}>
        {displayRole}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/40 text-muted-foreground">
      Staff
    </Badge>
  );
}

function ReplyThread({
  itemId,
  pinnedReply,
  initialReplies,
  canReply,
  canPin,
  onNewReply,
  onPinnedChange,
}: {
  itemId: number;
  pinnedReply: FeedbackReply | null;
  initialReplies: FeedbackReply[];
  canReply: boolean;
  canPin: boolean;
  onNewReply: (reply: FeedbackReply) => void;
  onPinnedChange: (reply: FeedbackReply | null) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pinning, setPinning] = useState<number | null>(null);

  async function handleSend() {
    const body = replyText.trim();
    if (!body) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`${API_URL}/feedback/${itemId}/replies`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.status === 201) {
        const newReply = await res.json() as FeedbackReply;
        setReplyText("");
        onNewReply(newReply);
      } else {
        const data = await res.json().catch(() => null);
        setSendError(data?.detail ?? "Failed to post reply.");
      }
    } catch {
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handlePin(replyId: number) {
    setPinning(replyId);
    try {
      const res = await fetch(`${API_URL}/feedback/${itemId}/replies/${replyId}/pin`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const updated = await res.json() as FeedbackReply;
        onPinnedChange(updated);
      }
    } finally {
      setPinning(null);
    }
  }

  async function handleUnpin(replyId: number) {
    setPinning(replyId);
    try {
      const res = await fetch(`${API_URL}/feedback/${itemId}/replies/${replyId}/pin`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        onPinnedChange(null);
      }
    } finally {
      setPinning(null);
    }
  }

  const allReplies = initialReplies.filter((r) => !r.is_pinned);

  return (
    <div className="space-y-3 pt-1">
      {/* Pinned reply at top */}
      {pinnedReply && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-2">
            <Pin className="h-3 w-3 text-primary/60 shrink-0" />
            <RankBadge clanRank={pinnedReply.author_clan_rank} />
            <span className="text-xs font-medium">{pinnedReply.author_name ?? "Staff"}</span>
            <span className="text-xs text-muted-foreground ml-auto">{relativeTime(pinnedReply.created_at)}</span>
            {canPin && (
              <button
                onClick={() => handleUnpin(pinnedReply.id)}
                disabled={pinning === pinnedReply.id}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Unpin"
              >
                <PinOff className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{pinnedReply.body}</p>
        </div>
      )}

      {/* All other replies */}
      {allReplies.map((r) => (
        <div key={r.id} className="flex flex-col gap-0.5 rounded-md px-3 py-2 bg-muted/40">
          <div className="flex items-center gap-2">
            <RankBadge clanRank={r.author_clan_rank} />
            <span className="text-xs font-medium">{r.author_name ?? "Anonymous"}</span>
            <span className="text-xs text-muted-foreground ml-auto">{relativeTime(r.created_at)}</span>
            {canPin && !r.is_pinned && (
              <button
                onClick={() => handlePin(r.id)}
                disabled={pinning === r.id}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Pin reply"
              >
                <Pin className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{r.body}</p>
        </div>
      ))}

      {pinnedReply === null && allReplies.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">No replies yet.</p>
      )}

      {/* Compose box */}
      {canReply && (
        <div className="space-y-2 pt-1">
          <Textarea
            placeholder="Write a comment..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="text-sm resize-none"
            maxLength={4000}
          />
          {sendError && <p className="text-xs text-destructive">{sendError}</p>}
          <Button
            size="sm"
            className="h-7 gap-1.5"
            disabled={sending || !replyText.trim()}
            onClick={handleSend}
          >
            <Send className="h-3 w-3" />
            {sending ? "Posting..." : "Post"}
          </Button>
        </div>
      )}
    </div>
  );
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

          {item.is_own && onEdit && (
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
  );
}
