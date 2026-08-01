import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Trash2, X } from "lucide-react";
import { formatTileRaceDate } from "@/lib/tilerace";
import type {
  SubmissionStatus,
  TileRaceSubmission,
  TileRaceTeam,
} from "@/types/tilerace";

interface SubmissionRowProps {
  submission: TileRaceSubmission;
  team: TileRaceTeam | undefined;
  busy: boolean;
  onReview: (status: SubmissionStatus, notes?: string) => void;
  onDelete: () => void;
}

const STATUS_VARIANT: Record<
  SubmissionStatus,
  "secondary" | "default" | "destructive"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export function SubmissionRow({
  submission,
  team,
  busy,
  onReview,
  onDelete,
}: SubmissionRowProps): JSX.Element {
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");

  const member = team?.members.find(
    (m) => m.discord_user_id === submission.discord_user_id,
  );
  const submitter = member?.rsn ?? submission.player_rsn ?? "Unknown player";

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: team?.color ?? "#888888" }}
        />
        <span className="text-sm font-medium">{team?.name ?? "Unknown team"}</span>
        <span className="text-xs text-muted-foreground">
          tile {submission.path_position}
        </span>
        <Badge variant={STATUS_VARIANT[submission.status]} className="ml-auto">
          {submission.status}
        </Badge>
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-sm">{submission.leaf_label || submission.leaf_key}</span>
        <span className="text-xs text-muted-foreground">
          {submitter} · {formatTileRaceDate(submission.submitted_at)}
        </span>
      </div>

      {submission.proof_urls.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {submission.proof_urls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <img
                src={url}
                alt="Submission proof"
                loading="lazy"
                className="h-16 w-16 rounded border object-cover hover:border-primary transition-colors"
              />
            </a>
          ))}
        </div>
      )}

      {submission.review_notes && (
        <p className="text-xs text-muted-foreground">
          Note: {submission.review_notes}
        </p>
      )}

      {rejecting ? (
        <div className="flex gap-1.5 flex-wrap">
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What is wrong with it?"
            className="h-8 text-xs flex-1 min-w-40"
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => onReview("rejected", notes || undefined)}
          >
            Confirm reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            disabled={busy || submission.status === "approved"}
            onClick={() => onReview("approved")}
            className="gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || submission.status === "rejected"}
            onClick={() => setRejecting(true)}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={onDelete}
            title="Remove this submission entirely, for one filed against the wrong tile"
            className="gap-1.5 ml-auto text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
