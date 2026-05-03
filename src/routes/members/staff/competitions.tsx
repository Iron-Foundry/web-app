import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { registerPage } from "@/lib/permissions";
import { StaffGuard } from "@/components/StaffGuard";
import { queryKeys } from "@/lib/queryKeys";
import {
  useCompetitionList,
  useCompetitionMetricMap,
  useCreateCompetition,
  useDeleteCompetition,
  useParticipantSuggestions,
  useUpdateCompetition,
} from "@/hooks/useCompetitions";
import metricsConfig from "@/competition-metrics.toml";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Plus, Trash2, X } from "lucide-react";
import type { Competition, CreateCompetitionInput, EditCompetitionInput, MetricMap } from "@/types/competitions";

registerPage({
  id: "staff.competitions",
  label: "Staff - Competitions",
  description: "Configure which metrics are tracked per competition.",
  defaults: {
    read: ["Senior Moderator"],
    create: ["Senior Moderator"],
    edit: ["Senior Moderator"],
    delete: ["Senior Moderator"],
  },
});

export const staffCompetitionsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/competitions",
  component: () => (
    <StaffGuard pageId="staff.competitions">
      <StaffCompetitionsPage />
    </StaffGuard>
  ),
});

const METRIC_GROUPS: { name: string; metrics: string[] }[] = metricsConfig.groups;

function fmtLabel(metric: string): string {
  return metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toUtcIso(local: string): string {
  return new Date(local).toISOString();
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------------------------------------------------------------------------
// Participant input - chip-based, supports datalist suggestions + paste
// ---------------------------------------------------------------------------

interface ParticipantInputProps {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
  id?: string;
}

function ParticipantInput({ value, onChange, suggestions, id = "participant-input" }: ParticipantInputProps) {
  const [draft, setDraft] = useState("");
  const listId = `${id}-list`;

  function addRsn(raw: string) {
    const rsns = raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!rsns.length) return;
    onChange([...new Set([...value, ...rsns])]);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRsn(draft);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (text.includes(",") || text.includes("\n")) {
      e.preventDefault();
      addRsn(draft + text);
    }
  }

  function remove(rsn: string) {
    onChange(value.filter((v) => v !== rsn));
  }

  return (
    <div className="space-y-2">
      <datalist id={listId}>
        {suggestions.map((s) => <option key={s} value={s} />)}
      </datalist>
      <div className="flex gap-2">
        <Input
          id={id}
          list={listId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Type RSN and press Enter, or paste comma-separated list"
          className="h-8 text-sm flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={() => addRsn(draft)} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((rsn) => (
            <Badge key={rsn} variant="secondary" className="gap-1.5 cursor-pointer hover:bg-destructive/20 transition-colors" onClick={() => remove(rsn)}>
              {rsn}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">Empty = all clan members added automatically.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team builder
// ---------------------------------------------------------------------------

interface Team {
  name: string;
  participants: string[];
}

interface TeamBuilderProps {
  value: Team[];
  onChange: (v: Team[]) => void;
  suggestions: string[];
}

function TeamBuilder({ value, onChange, suggestions }: TeamBuilderProps) {
  function addTeam() {
    onChange([...value, { name: "", participants: [] }]);
  }

  function removeTeam(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function updateTeam(i: number, patch: Partial<Team>) {
    onChange(value.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  return (
    <div className="space-y-3">
      {value.map((team, i) => (
        <Card key={i} className="p-3">
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Input
                value={team.name}
                onChange={(e) => updateTeam(i, { name: e.target.value })}
                placeholder="Team name"
                className="h-8 text-sm"
              />
              <Button type="button" size="sm" variant="ghost" onClick={() => removeTeam(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <ParticipantInput
              id={`team-${i}-participants`}
              value={team.participants}
              onChange={(p) => updateTeam(i, { participants: p })}
              suggestions={suggestions}
            />
          </div>
        </Card>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={addTeam} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Add Team
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Competition form (shared by create + edit)
// ---------------------------------------------------------------------------

interface CompFormState {
  title: string;
  metric: string;
  type: "classic" | "team";
  starts_at: string;
  ends_at: string;
  participants: string[];
  teams: Team[];
}

function emptyForm(): CompFormState {
  return { title: "", metric: "", type: "classic", starts_at: "", ends_at: "", participants: [], teams: [] };
}

function formFromComp(c: Competition): CompFormState {
  return {
    title: c.title,
    metric: c.metric,
    type: (c.type === "team" ? "team" : "classic") as "classic" | "team",
    starts_at: toLocalDatetime(c.startsAt),
    ends_at: toLocalDatetime(c.endsAt),
    participants: [],
    teams: [],
  };
}

interface CompFormProps {
  state: CompFormState;
  onChange: (s: CompFormState) => void;
  suggestions: string[];
}

function CompForm({ state, onChange, suggestions }: CompFormProps) {
  function set<K extends keyof CompFormState>(key: K, val: CompFormState[K]) {
    onChange({ ...state, [key]: val });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cf-title">Title</Label>
        <Input id="cf-title" value={state.title} onChange={(e) => set("title", e.target.value)} placeholder="Competition title" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cf-metric">Metric</Label>
          <Select value={state.metric} onValueChange={(v) => set("metric", v)}>
            <SelectTrigger id="cf-metric">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {METRIC_GROUPS.map(({ name, metrics }) => (
                <div key={name}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{name}</div>
                  {metrics.map((m) => (
                    <SelectItem key={m} value={m}>{fmtLabel(m)}</SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-type">Type</Label>
          <Select value={state.type} onValueChange={(v) => set("type", v as "classic" | "team")}>
            <SelectTrigger id="cf-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cf-starts">Starts At</Label>
          <Input id="cf-starts" type="datetime-local" value={state.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-ends">Ends At</Label>
          <Input id="cf-ends" type="datetime-local" value={state.ends_at} onChange={(e) => set("ends_at", e.target.value)} />
        </div>
      </div>

      {state.type === "classic" && (
        <div className="space-y-1.5">
          <Label>Participants Override</Label>
          <ParticipantInput value={state.participants} onChange={(p) => set("participants", p)} suggestions={suggestions} />
        </div>
      )}

      {state.type === "team" && (
        <div className="space-y-1.5">
          <Label>Teams</Label>
          <TeamBuilder value={state.teams} onChange={(t) => set("teams", t)} suggestions={suggestions} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function StaffCompetitionsPage() {
  useAuth();
  const queryClient = useQueryClient();

  const { data: competitions = [], isLoading: loading } = useCompetitionList();
  const { data: metricMap = {} } = useCompetitionMetricMap();
  const { data: participantSuggestions = [] } = useParticipantSuggestions();

  const createMutation = useCreateCompetition();
  const updateMutation = useUpdateCompetition();
  const deleteMutation = useDeleteCompetition();

  const rsnSuggestions = participantSuggestions.map((p) => p.rsn);

  // Metric map state
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CompFormState>(emptyForm());
  const [createError, setCreateError] = useState("");

  const [editTarget, setEditTarget] = useState<Competition | null>(null);
  const [editForm, setEditForm] = useState<CompFormState>(emptyForm());
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const selectedComp = competitions.find((c) => String(c.id) === selectedId) ?? null;

  function handleCompSelect(id: string) {
    setSelectedId(id);
    setPending(metricMap[id] ?? []);
    setSaved(false);
  }

  function toggleMetric(metric: string) {
    setPending((prev) => prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]);
    setSaved(false);
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/clan/competitions/metric-map`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ competition_id: parseInt(selectedId), metrics: pending }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      void queryClient.invalidateQueries({ queryKey: queryKeys.competitions.metricMap() });
      setSaved(true);
    } catch {
      // keep current state on error
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setCreateForm(emptyForm());
    setCreateError("");
    setCreateOpen(true);
  }

  function openEdit(comp: Competition) {
    setEditForm(formFromComp(comp));
    setEditError("");
    setEditTarget(comp);
  }

  function openDelete(comp: Competition) {
    setDeleteConfirm("");
    setDeleteTarget(comp);
  }

  async function handleCreate() {
    setCreateError("");
    if (!createForm.title || !createForm.metric || !createForm.starts_at || !createForm.ends_at) {
      setCreateError("Title, metric, start and end time are required.");
      return;
    }
    const input: CreateCompetitionInput = {
      title: createForm.title,
      metric: createForm.metric,
      starts_at: toUtcIso(createForm.starts_at),
      ends_at: toUtcIso(createForm.ends_at),
      type: createForm.type,
    };
    if (createForm.type === "team") {
      input.teams = createForm.teams.map((t) => ({ name: t.name, participants: t.participants }));
    } else if (createForm.participants.length > 0) {
      input.participants = createForm.participants;
    }
    try {
      await createMutation.mutateAsync(input);
      setCreateOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create competition.");
    }
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError("");
    const input: EditCompetitionInput = {};
    if (editForm.title !== editTarget.title) input.title = editForm.title;
    if (editForm.metric !== editTarget.metric) input.metric = editForm.metric;
    const origStart = toLocalDatetime(editTarget.startsAt);
    const origEnd = toLocalDatetime(editTarget.endsAt);
    if (editForm.starts_at !== origStart) input.starts_at = toUtcIso(editForm.starts_at);
    if (editForm.ends_at !== origEnd) input.ends_at = toUtcIso(editForm.ends_at);
    if (!Object.keys(input).length) {
      setEditTarget(null);
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, data: input });
      setEditTarget(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update competition.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      if (selectedId === String(deleteTarget.id)) setSelectedId("");
      setDeleteTarget(null);
    } catch (err) {
      // error visible via mutation state
      void err;
    }
  }

  const grouped = {
    ongoing: competitions.filter((c) => c.status === "ongoing"),
    upcoming: competitions.filter((c) => c.status === "upcoming"),
    finished: competitions.filter((c) => c.status === "finished"),
  };

  const filterLower = filter.toLowerCase();
  const filteredGroups = METRIC_GROUPS.map(({ name, metrics }) => ({
    group: name,
    metrics: filter
      ? metrics.filter((m) => m.includes(filterLower) || fmtLabel(m).toLowerCase().includes(filterLower))
      : metrics,
  })).filter(({ metrics }) => metrics.length > 0);

  return (
    <div className="mx-auto max-w-4xl w-full space-y-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Competition Management</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and configure WOM group competitions.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Create Competition
        </Button>
      </div>

      {/* Competition selector */}
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Select Competition</p>
            {selectedComp && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(selectedComp)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => openDelete(selectedComp)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <Select value={selectedId} onValueChange={handleCompSelect} disabled={loading}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder={loading ? "Loading..." : "Choose a competition"} />
            </SelectTrigger>
            <SelectContent>
              {grouped.ongoing.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Ongoing</div>
                  {grouped.ongoing.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                  ))}
                </>
              )}
              {grouped.upcoming.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Upcoming</div>
                  {grouped.upcoming.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                  ))}
                </>
              )}
              {grouped.finished.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Finished</div>
                  {grouped.finished.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Metric configurator */}
      {selectedId && (
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Tracked Metrics</p>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : saved ? "Saved" : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {pending.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {pending.map((m) => (
                  <Badge
                    key={m}
                    variant="secondary"
                    className="gap-1.5 cursor-pointer hover:bg-destructive/20 transition-colors"
                    onClick={() => toggleMetric(m)}
                  >
                    {fmtLabel(m)}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No metrics selected. Pick from the list below.</p>
            )}
            <Separator />
            <Input
              placeholder="Filter metrics..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {filteredGroups.map(({ group, metrics }) => (
                <div key={group}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">{group}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {metrics.map((m) => {
                      const checked = pending.includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => toggleMetric(m)}
                          className={`text-left text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                            checked
                              ? "bg-primary/15 border-primary/40 text-primary font-medium"
                              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {fmtLabel(m)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Competition</DialogTitle>
          </DialogHeader>
          <CompForm state={createForm} onChange={setCreateForm} suggestions={rsnSuggestions} />
          {createError && <p className="text-sm text-destructive">{createError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Competition</DialogTitle>
          </DialogHeader>
          <CompForm state={editForm} onChange={setEditForm} suggestions={rsnSuggestions} />
          {editError && <p className="text-sm text-destructive">{editError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Competition</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This permanently deletes <span className="font-medium text-foreground">{deleteTarget?.title}</span> from WOM. This cannot be undone.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="delete-confirm">
                Type <span className="font-mono font-medium">Delete</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Delete"
              />
            </div>
            {deleteMutation.isError && (
              <p className="text-sm text-destructive">
                {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Failed to delete competition."}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirm !== "Delete" || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

