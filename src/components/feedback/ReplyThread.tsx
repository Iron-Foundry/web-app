import { useState } from "react";
import { Send, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import type { FeedbackReply } from "./feedbackTypes";
import { relativeTime } from "./feedbackStatus";
import { RankBadge } from "./FeedbackParts";

export function ReplyThread({
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
