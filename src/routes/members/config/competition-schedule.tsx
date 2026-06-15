import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { registerPage } from "@/lib/permissions";
import { StaffGuard } from "@/components/StaffGuard";
import {
  useScheduleList,
  useScheduleRuns,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  usePauseSchedule,
  useResumeSchedule,
  useSkipNext,
  useTriggerNow,
  useOverrideOptions,
  usePatchRun,
} from "@/hooks/useCompetitionSchedule";
import metricsConfig from "@/competition-metrics.toml";
import type {
  CompetitionSchedule,
  CreateScheduleInput,
  PatchRunInput,
  PollOption,
  RunStatus,
  ScheduledCompetitionRun,
} from "@/types/competitionSchedule";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, Play, Pause, SkipForward, Plus, Trash2, Zap, Settings, Pencil } from "lucide-react";

registerPage({
  id: "staff.comp-schedule",
  label: "Staff - Competition Schedule",
  description: "Manage rolling competition schedules with automated Discord polls.",
  defaults: {
    read: ["Senior Moderator"],
    create: ["Senior Moderator"],
    edit: ["Senior Moderator"],
    delete: ["Senior Moderator"],
  },
});

export const staffCompScheduleRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/config/competition-schedule",
  component: () => (
    <StaffGuard pageId="staff.comp-schedule">
      <CompSchedulePage />
    </StaffGuard>
  ),
});

// ── Metric options from TOML ────────────────────────────────────────────

type MetricGroup = { name: string; metrics: string[] };
const ALL_METRIC_GROUPS: MetricGroup[] = (metricsConfig as { groups: MetricGroup[] }).groups ?? [];
const ALL_METRICS: { label: string; value: string }[] = ALL_METRIC_GROUPS.flatMap((g) =>
  g.metrics.map((m) => ({
    value: m,
    label: m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }))
);

// ── Status badge ────────────────────────────────────────────────────────

function RunStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending_poll: "bg-muted text-muted-foreground",
    poll_active: "bg-blue-500/15 text-blue-500",
    competition_pending: "bg-yellow-500/15 text-yellow-500",
    competition_active: "bg-green-500/15 text-green-500",
    results_announced: "bg-muted text-muted-foreground",
    skipped: "bg-muted text-muted-foreground",
    error: "bg-destructive/15 text-destructive",
  };
  const labels: Record<string, string> = {
    pending_poll: "Waiting",
    poll_active: "Poll Live",
    competition_pending: "Creating Comp",
    competition_active: "Active",
    results_announced: "Done",
    skipped: "Skipped",
    error: "Error",
  };
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${variants[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Poll options editor ─────────────────────────────────────────────────

function PollOptionsEditor({
  value,
  onChange,
}: {
  value: PollOption[];
  onChange: (opts: PollOption[]) => void;
}) {
  const [metricFilter, setMetricFilter] = useState("");

  const filtered = ALL_METRICS.filter(
    (m) =>
      !value.some((o) => o.metric === m.value) &&
      m.label.toLowerCase().includes(metricFilter.toLowerCase())
  );

  const add = (metric: string, label: string) => {
    if (value.length >= 10) return;
    onChange([...value, { metric, label }]);
    setMetricFilter("");
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {value.map((opt, i) => (
          <div key={opt.metric} className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm">
            {opt.label}
            <button onClick={() => remove(i)} className="ml-1 text-muted-foreground hover:text-foreground">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      {value.length < 10 && (
        <div className="flex gap-2">
          <Input
            placeholder="Filter metrics..."
            value={metricFilter}
            onChange={(e) => setMetricFilter(e.target.value)}
            className="h-8 text-sm"
          />
          <Select onValueChange={(v) => add(v, ALL_METRICS.find((m) => m.value === v)?.label ?? v)}>
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue placeholder="Add metric" />
            </SelectTrigger>
            <SelectContent>
              {filtered.slice(0, 20).map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// ── Create / Edit dialog ────────────────────────────────────────────────

interface ScheduleFormState {
  name: string;
  description: string;
  poll_channel_id: string;
  results_channel_id: string;
  poll_duration_hours: string;
  competition_duration_hours: string;
  recurrence_days: string;
  title_template: string;
  next_poll_at: string;
  poll_options: PollOption[];
}

function defaultForm(sched?: CompetitionSchedule): ScheduleFormState {
  return {
    name: sched?.name ?? "",
    description: sched?.description ?? "",
    poll_channel_id: sched ? String(sched.poll_channel_id) : "",
    results_channel_id: sched ? String(sched.results_channel_id) : "",
    poll_duration_hours: String(sched?.poll_duration_hours ?? 24),
    competition_duration_hours: String(sched?.competition_duration_hours ?? 168),
    recurrence_days: String(sched?.recurrence_days ?? 7),
    title_template: sched?.title_template ?? "{metric} Competition",
    next_poll_at: sched?.next_poll_at
      ? sched.next_poll_at.slice(0, 16)
      : new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    poll_options: sched?.poll_options ?? [],
  };
}

function ScheduleDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: CompetitionSchedule;
}) {
  const [form, setForm] = useState<ScheduleFormState>(() => defaultForm(existing));
  const create = useCreateSchedule();
  const update = useUpdateSchedule(existing?.id ?? 0);

  const set = (key: keyof ScheduleFormState, val: string | PollOption[]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    const payload: CreateScheduleInput = {
      name: form.name,
      description: form.description || undefined,
      poll_channel_id: form.poll_channel_id,
      results_channel_id: form.results_channel_id,
      poll_duration_hours: Number(form.poll_duration_hours),
      competition_duration_hours: Number(form.competition_duration_hours),
      recurrence_days: Number(form.recurrence_days),
      title_template: form.title_template,
      next_poll_at: new Date(form.next_poll_at).toISOString(),
      poll_options: form.poll_options,
    };
    if (existing) {
      await update.mutateAsync(payload);
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Schedule" : "New Competition Schedule"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Weekly Skilling" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Poll Channel ID</Label>
              <Input value={form.poll_channel_id} onChange={(e) => set("poll_channel_id", e.target.value)} placeholder="Discord channel ID" />
            </div>
            <div>
              <Label>Results Channel ID</Label>
              <Input value={form.results_channel_id} onChange={(e) => set("results_channel_id", e.target.value)} placeholder="Discord channel ID" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Poll Duration (h)</Label>
              <Input type="number" value={form.poll_duration_hours} onChange={(e) => set("poll_duration_hours", e.target.value)} />
            </div>
            <div>
              <Label>Comp Duration (h)</Label>
              <Input type="number" value={form.competition_duration_hours} onChange={(e) => set("competition_duration_hours", e.target.value)} />
            </div>
            <div>
              <Label>Recurrence (days)</Label>
              <Input type="number" value={form.recurrence_days} onChange={(e) => set("recurrence_days", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Title Template</Label>
            <Input value={form.title_template} onChange={(e) => set("title_template", e.target.value)} placeholder="{metric} Competition" />
            <p className="mt-0.5 text-xs text-muted-foreground">Use {"{metric}"} to insert the winning metric name.</p>
          </div>
          <div>
            <Label>First Poll At</Label>
            <Input type="datetime-local" value={form.next_poll_at} onChange={(e) => set("next_poll_at", e.target.value)} />
          </div>
          <div>
            <Label>Poll Options (2-10)</Label>
            <PollOptionsEditor value={form.poll_options} onChange={(opts) => set("poll_options", opts)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || form.poll_options.length < 2}>
            {isPending ? "Saving..." : existing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Override options dialog ─────────────────────────────────────────────

function OverrideDialog({
  open,
  onClose,
  schedule,
}: {
  open: boolean;
  onClose: () => void;
  schedule: CompetitionSchedule;
}) {
  const [options, setOptions] = useState<PollOption[]>([...schedule.poll_options]);
  const override = useOverrideOptions(schedule.id);

  const handleSubmit = async () => {
    await override.mutateAsync({ options });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Override Poll Options (next run only)</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <PollOptionsEditor value={options} onChange={setOptions} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={override.isPending || options.length < 2}>
            {override.isPending ? "Saving..." : "Apply Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Run edit dialog ─────────────────────────────────────────────────────

const RUN_STATUSES: RunStatus[] = [
  "pending_poll", "poll_active", "competition_pending",
  "competition_active", "results_announced", "skipped", "error",
];

function RunEditDialog({
  open,
  onClose,
  run,
  scheduleId,
}: {
  open: boolean;
  onClose: () => void;
  run: ScheduledCompetitionRun;
  scheduleId: number;
}) {
  const patch = usePatchRun(scheduleId);
  // Format ISO string as YYYY-MM-DDTHH:MM in UTC for datetime-local input
  const toUtcLocal = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    status: run.status as RunStatus,
    winning_metric: run.winning_metric ?? "",
    wom_competition_id: run.wom_competition_id != null ? String(run.wom_competition_id) : "",
    competition_title: run.competition_title ?? "",
    competition_starts_at: toUtcLocal(run.competition_starts_at),
    competition_ends_at: toUtcLocal(run.competition_ends_at),
    error_detail: run.error_detail ?? "",
  });

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    const data: PatchRunInput = { status: form.status };
    if (form.winning_metric) data.winning_metric = form.winning_metric;
    if (form.wom_competition_id) data.wom_competition_id = Number(form.wom_competition_id);
    if (form.competition_title) data.competition_title = form.competition_title;
    if (form.competition_starts_at) data.competition_starts_at = new Date(form.competition_starts_at).toISOString();
    if (form.competition_ends_at) data.competition_ends_at = new Date(form.competition_ends_at).toISOString();
    if (form.error_detail) data.error_detail = form.error_detail;
    await patch.mutateAsync({ runId: run.id, data });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Run #{run.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RUN_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Winning Metric</Label>
              <Select value={form.winning_metric || "__none__"} onValueChange={(v) => set("winning_metric", v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {ALL_METRICS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>WOM Competition ID</Label>
              <Input
                value={form.wom_competition_id}
                onChange={(e) => set("wom_competition_id", e.target.value)}
                placeholder="WOM numeric ID"
              />
            </div>
          </div>
          <div>
            <Label>Competition Title</Label>
            <Input value={form.competition_title} onChange={(e) => set("competition_title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Comp Starts At <span className="text-muted-foreground">(UTC)</span></Label>
              <Input type="datetime-local" value={form.competition_starts_at} onChange={(e) => set("competition_starts_at", e.target.value)} />
            </div>
            <div>
              <Label>Comp Ends At <span className="text-muted-foreground">(UTC)</span></Label>
              <Input type="datetime-local" value={form.competition_ends_at} onChange={(e) => set("competition_ends_at", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Error Detail</Label>
            <Input value={form.error_detail} onChange={(e) => set("error_detail", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={patch.isPending}>
            {patch.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Run history ─────────────────────────────────────────────────────────

function RunHistory({ scheduleId }: { scheduleId: number }) {
  const { data: runs } = useScheduleRuns(scheduleId);
  const [editRun, setEditRun] = useState<ScheduledCompetitionRun | null>(null);

  if (!runs?.length) return <p className="text-sm text-muted-foreground">No runs yet.</p>;

  return (
    <>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-1 pr-3">Status</th>
              <th className="py-1 pr-3">Metric</th>
              <th className="py-1 pr-3">Poll ended</th>
              <th className="py-1 pr-3">Comp ends</th>
              <th className="py-1 pr-3">WOM ID</th>
              <th className="py-1"></th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r: ScheduledCompetitionRun) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-1 pr-3"><RunStatusBadge status={r.status} /></td>
                <td className="py-1 pr-3">{r.winning_metric ?? "-"}</td>
                <td className="py-1 pr-3">
                  {r.poll_ends_at ? new Date(r.poll_ends_at).toLocaleString() : "-"}
                </td>
                <td className="py-1 pr-3">
                  {r.competition_ends_at ? new Date(r.competition_ends_at).toLocaleString() : "-"}
                </td>
                <td className="py-1 pr-3">
                  {r.wom_competition_id ? (
                    <a
                      href={`https://wiseoldman.net/competitions/${r.wom_competition_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      {r.wom_competition_id}
                    </a>
                  ) : "-"}
                </td>
                <td className="py-1">
                  <button
                    onClick={() => setEditRun(r)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editRun && (
        <RunEditDialog
          open
          run={editRun}
          scheduleId={scheduleId}
          onClose={() => setEditRun(null)}
        />
      )}
    </>
  );
}

// ── Schedule card ───────────────────────────────────────────────────────

function ScheduleCard({ schedule }: { schedule: CompetitionSchedule }) {
  const [showRuns, setShowRuns] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);

  const pause = usePauseSchedule();
  const resume = useResumeSchedule();
  const skip = useSkipNext();
  const trigger = useTriggerNow();
  const del = useDeleteSchedule();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{schedule.name}</CardTitle>
            <Badge variant={schedule.is_active ? "default" : "secondary"}>
              {schedule.is_active ? "Active" : "Paused"}
            </Badge>
            {schedule.active_run && <RunStatusBadge status={schedule.active_run.status} />}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Every</span>{" "}
            <span className="font-medium">{schedule.recurrence_days}d</span>
          </div>
          <div>
            <span className="text-muted-foreground">Poll</span>{" "}
            <span className="font-medium">{schedule.poll_duration_hours}h</span>
          </div>
          <div>
            <span className="text-muted-foreground">Comp</span>{" "}
            <span className="font-medium">{schedule.competition_duration_hours}h</span>
          </div>
        </div>

        {schedule.next_poll_at && (
          <p className="text-xs text-muted-foreground">
            Next poll: {new Date(schedule.next_poll_at).toLocaleString()}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {schedule.is_active ? (
            <Button size="sm" variant="outline" onClick={() => pause.mutate(schedule.id)} disabled={pause.isPending}>
              <Pause className="mr-1 h-3 w-3" /> Pause
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => resume.mutate(schedule.id)} disabled={resume.isPending}>
              <Play className="mr-1 h-3 w-3" /> Resume
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => skip.mutate(schedule.id)} disabled={skip.isPending}>
            <SkipForward className="mr-1 h-3 w-3" /> Skip Next
          </Button>
          <Button size="sm" variant="outline" onClick={() => trigger.mutate(schedule.id)} disabled={trigger.isPending}>
            <Zap className="mr-1 h-3 w-3" /> Trigger Now
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOverrideOpen(true)}>
            Override Options
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => del.mutate(schedule.id)}
            disabled={del.isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <div>
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowRuns((v) => !v)}
          >
            {showRuns ? "Hide" : "Show"} run history
          </button>
          {showRuns && <RunHistory scheduleId={schedule.id} />}
        </div>
      </CardContent>

      {editOpen && (
        <ScheduleDialog open existing={schedule} onClose={() => setEditOpen(false)} />
      )}
      {overrideOpen && (
        <OverrideDialog open schedule={schedule} onClose={() => setOverrideOpen(false)} />
      )}
    </Card>
  );
}

// ── Page ────────────────────────────────────────────────────────────────

function CompSchedulePage() {
  const { data: schedules, isLoading } = useScheduleList();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Competition Schedules</h2>
          <p className="text-sm text-muted-foreground">
            Automated rolling competitions with Discord polls.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Schedule
        </Button>
      </div>

      <Separator />

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && !schedules?.length && (
        <p className="text-sm text-muted-foreground">
          No schedules yet. Create one to get started.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {schedules?.map((s: CompetitionSchedule) => (
          <ScheduleCard key={s.id} schedule={s} />
        ))}
      </div>

      {createOpen && <ScheduleDialog open onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
