import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useDeleteSubmission,
  useReviewSubmission,
  useSubmissions,
} from "@/hooks/useTilerace";
import { SubmissionRow } from "./SubmissionRow";
import type {
  SubmissionStatus,
  TileRaceEvent,
} from "@/types/tilerace";

interface SubmissionsPanelProps {
  event: TileRaceEvent;
}

const FILTERS: Array<{ label: string; value: SubmissionStatus | undefined }> = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: undefined },
];

export function SubmissionsPanel({ event }: SubmissionsPanelProps): JSX.Element {
  const [filter, setFilter] = useState<SubmissionStatus | undefined>("pending");
  const { data, isLoading } = useSubmissions(event.id, filter);
  const { mutate: review, isPending } = useReviewSubmission();
  const { mutate: remove, isPending: isDeleting } = useDeleteSubmission();

  const submissions = data?.submissions ?? [];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold">Submissions</p>
          <div className="flex gap-1 ml-auto">
            {FILTERS.map((f) => (
              <Button
                key={f.label}
                size="sm"
                variant={filter === f.value ? "default" : "outline"}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
                {f.value === "pending" && data && filter === "pending"
                  ? ` ${data.total}`
                  : ""}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Approving keeps a team's claim. Rejecting sends them back to that tile and
          locks their rolls until it is redone; their furthest position is handed back
          once it passes again.
        </p>

        {isLoading && (
          <p className="text-xs text-muted-foreground">Loading submissions...</p>
        )}
        {!isLoading && submissions.length === 0 && (
          <p className="text-xs text-muted-foreground">Nothing to review here.</p>
        )}

        <div className="space-y-2">
          {submissions.map((submission) => (
            <SubmissionRow
              key={submission.id}
              submission={submission}
              team={event.teams.find((t) => t.id === submission.team_id)}
              busy={isPending || isDeleting}
              onReview={(status, notes) =>
                review({
                  eventId: event.id,
                  submissionId: submission.id,
                  status,
                  reviewNotes: notes,
                })
              }
              onDelete={() =>
                remove({ eventId: event.id, submissionId: submission.id })
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
