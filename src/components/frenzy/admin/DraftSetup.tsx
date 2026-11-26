import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dices, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDrawOrder, useFrenzyDraft, useResetDraft, useSetUpDraft, useStartDraft } from "@/hooks/useFrenzyDraft";
import type { DraftMode } from "@/types/frenzyDraft";
import { CaptainPicker } from "./CaptainPicker";

const toastError = (err: unknown): void => {
  toast.error(err instanceof Error ? err.message : "The draft could not be saved.");
};

/** The staff steps of the captain draft: mode, top picks, captains, draw, start and reset. */
export function DraftSetup({ eventId }: { eventId: number }): React.ReactElement {
  const { data: draft } = useFrenzyDraft(eventId);
  const setUp = useSetUpDraft(eventId);
  const draw = useDrawOrder(eventId);
  const start = useStartDraft(eventId);
  const reset = useResetDraft(eventId);
  const [mode, setMode] = useState<DraftMode>("top_picks");
  const [topPicks, setTopPicks] = useState("5");
  const [captains, setCaptains] = useState<number[]>([]);

  useEffect(() => {
    if (!draft) return;
    setMode(draft.mode);
    setTopPicks(String(draft.top_picks));
    setCaptains(draft.captains.map((c) => c.signup_id));
  }, [draft]);

  const editable = !draft || draft.state === "setup";
  const save = (): void =>
    setUp.mutate(
      { mode, top_picks: Number(topPicks), captain_signup_ids: captains },
      { onSuccess: () => toast.success("Draft setup saved."), onError: toastError },
    );
  const remove = (): void => {
    if (!confirm("Reset the draft? Every pick is removed and the drafted teams are deleted.")) return;
    reset.mutate(undefined, { onError: toastError });
  };

  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-rs-bold text-lg">Captain draft</h3>
        {draft && (
          <Button asChild size="sm" variant="ghost">
            <Link to="/activities/frenzy/draft">Open the draft page</Link>
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Mode</Label>
          <ToggleGroup type="single" variant="outline" value={mode} disabled={!editable} onValueChange={(v) => v && setMode(v as DraftMode)}>
            <ToggleGroupItem value="full">Full draft</ToggleGroupItem>
            <ToggleGroupItem value="top_picks">Top Picks</ToggleGroupItem>
          </ToggleGroup>
        </div>
        {mode === "top_picks" && (
          <div className="space-y-1.5">
            <Label htmlFor="draft-top-picks">Top picks per captain</Label>
            <Input id="draft-top-picks" type="number" min={1} max={100} value={topPicks} disabled={!editable} onChange={(e) => setTopPicks(e.target.value)} className="w-24" />
          </div>
        )}
      </div>
      <CaptainPicker eventId={eventId} chosen={captains} disabled={!editable} onChange={setCaptains} />
      <div className="flex flex-wrap gap-2">
        {editable && (
          <Button size="sm" variant="outline" onClick={save} disabled={setUp.isPending || captains.length < 2}>
            Save setup
          </Button>
        )}
        {draft?.state === "setup" && (
          <Button size="sm" onClick={() => draw.mutate(undefined, { onError: toastError })} disabled={draw.isPending}>
            <Dices className="mr-1.5 h-4 w-4" />
            Draw the order
          </Button>
        )}
        {draft?.state === "drawn" && (
          <Button size="sm" onClick={() => start.mutate(undefined, { onError: toastError })} disabled={start.isPending}>
            <Play className="mr-1.5 h-4 w-4" />
            Start the draft
          </Button>
        )}
        {draft && (
          <Button size="sm" variant="destructive" onClick={remove} disabled={reset.isPending} className="ml-auto">
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset draft
          </Button>
        )}
      </div>
    </section>
  );
}
