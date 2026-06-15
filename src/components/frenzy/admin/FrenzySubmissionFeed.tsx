import { useState } from "react";
import { Check, X, Trash2, ChevronLeft, ChevronRight, Search, SlidersHorizontal, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSubmissions, usePatchSubmission, useDeleteSubmission } from "@/hooks/useFrenzy";
import { useSubmissionFilters, PAGE_SIZE } from "@/hooks/useSubmissionFilters";
import type { FrenzySubmission, FrenzySubmissionStatus } from "@/types/frenzy";

const STATUS_COLORS: Record<FrenzySubmissionStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-600 border-green-500/30",
  rejected: "bg-red-500/20 text-red-600 border-red-500/30",
};

const SOURCE_LABELS: Record<string, string> = {
  trackscape: "Trackscape",
  discord_ocr: "Discord OCR",
  discord_manual: "Discord Manual",
  web: "Web",
};

interface Props {
  eventId: number;
  teams: Array<{ id: number; name: string; slug: string }>;
}

function payloadSummary(sub: FrenzySubmission): string {
  const p = sub.payload as Record<string, unknown>;
  if (sub.submission_type === "item") {
    const qty = p.quantity != null ? ` x${p.quantity}` : "";
    return `${p.tier} / ${p.source_name} / ${p.item_name}${qty}`;
  }
  if (sub.submission_type === "activity" || sub.submission_type === "milestone") {
    return `${p.name}: ${p.value}`;
  }
  return JSON.stringify(p);
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        className="text-sm border rounded px-2 py-1.5 bg-background min-w-[130px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Any</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs text-foreground">
      {label}
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground ml-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function FrenzySubmissionFeed({ eventId, teams }: Props) {
  const f = useSubmissionFilters();
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useSubmissions(eventId, f.params);
  const patchMutation = usePatchSubmission();
  const deleteMutation = useDeleteSubmission();

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;
  const teamMap = Object.fromEntries(teams.map((t) => [String(t.id), t.name]));

  function approve(sub: FrenzySubmission) {
    patchMutation.mutate({ eventId, submissionId: sub.id, data: { status: "approved" } });
  }
  function reject(sub: FrenzySubmission) {
    patchMutation.mutate({ eventId, submissionId: sub.id, data: { status: "rejected" } });
  }
  function remove(sub: FrenzySubmission) {
    deleteMutation.mutate({ eventId, submissionId: sub.id });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search player, item, boss, activity..."
            value={f.search}
            onChange={(e) => { f.setSearch(e.target.value); f.resetPage(); }}
          />
          {f.search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => { f.setSearch(""); f.resetPage(); }}
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setShowFilters((v) => !v)}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {f.activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
              {f.activeFilterCount}
            </span>
          )}
        </Button>
        {(f.activeFilterCount > 0 || f.search) && (
          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={f.clearAllFilters}>
            Clear all
          </Button>
        )}
        {data && (
          <span className="text-sm text-muted-foreground ml-auto">
            {data.total.toLocaleString()} result{data.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {showFilters && (
        <div className="rounded-lg border bg-muted/20 p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Player RSN</label>
            <Input className="h-8 text-sm" placeholder="e.g. Zezima" value={f.playerRsn}
              onChange={(e) => { f.setPlayerRsn(e.target.value); f.resetPage(); }} />
          </div>
          <FilterSelect label="Team" value={f.teamFilter}
            onChange={(v) => { f.setTeamFilter(v); f.resetPage(); }}
            options={teams.map((t) => ({ value: String(t.id), label: t.name }))} />
          <FilterSelect label="Status" value={f.statusFilter}
            onChange={(v) => { f.setStatusFilter(v); f.resetPage(); }}
            options={[{ value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }]} />
          <FilterSelect label="Type" value={f.typeFilter}
            onChange={(v) => { f.setTypeFilter(v); f.resetPage(); }}
            options={[{ value: "item", label: "Item" }, { value: "activity", label: "Activity" }, { value: "milestone", label: "Milestone" }]} />
          <FilterSelect label="Source" value={f.sourceFilter}
            onChange={(v) => { f.setSourceFilter(v); f.resetPage(); }}
            options={[{ value: "trackscape", label: "Trackscape" }, { value: "discord_ocr", label: "Discord OCR" }, { value: "discord_manual", label: "Discord Manual" }, { value: "web", label: "Web" }]} />
          <FilterSelect label="Auto-approved" value={f.autoApprovedFilter}
            onChange={(v) => { f.setAutoApprovedFilter(v); f.resetPage(); }}
            options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Submitted after</label>
            <input type="date" className="text-sm border rounded px-2 py-1.5 bg-background h-8"
              value={f.submittedAfter} onChange={(e) => { f.setSubmittedAfter(e.target.value); f.resetPage(); }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Submitted before</label>
            <input type="date" className="text-sm border rounded px-2 py-1.5 bg-background h-8"
              value={f.submittedBefore} onChange={(e) => { f.setSubmittedBefore(e.target.value); f.resetPage(); }} />
          </div>
        </div>
      )}

      {f.activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {f.teamFilter && <Chip label={`Team: ${teamMap[f.teamFilter] ?? f.teamFilter}`} onRemove={() => { f.setTeamFilter(""); f.resetPage(); }} />}
          {f.statusFilter && <Chip label={`Status: ${f.statusFilter}`} onRemove={() => { f.setStatusFilter(""); f.resetPage(); }} />}
          {f.typeFilter && <Chip label={`Type: ${f.typeFilter}`} onRemove={() => { f.setTypeFilter(""); f.resetPage(); }} />}
          {f.sourceFilter && <Chip label={`Source: ${SOURCE_LABELS[f.sourceFilter] ?? f.sourceFilter}`} onRemove={() => { f.setSourceFilter(""); f.resetPage(); }} />}
          {f.debouncedPlayerRsn && <Chip label={`Player: ${f.debouncedPlayerRsn}`} onRemove={() => { f.setPlayerRsn(""); f.resetPage(); }} />}
          {f.autoApprovedFilter && <Chip label={`Auto-approved: ${f.autoApprovedFilter === "true" ? "Yes" : "No"}`} onRemove={() => { f.setAutoApprovedFilter(""); f.resetPage(); }} />}
          {f.submittedAfter && <Chip label={`After: ${f.submittedAfter}`} onRemove={() => { f.setSubmittedAfter(""); f.resetPage(); }} />}
          {f.submittedBefore && <Chip label={`Before: ${f.submittedBefore}`} onRemove={() => { f.setSubmittedBefore(""); f.resetPage(); }} />}
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {data && data.submissions.length === 0 && (
        <p className="text-sm text-muted-foreground">No submissions match the current filters.</p>
      )}

      {data && data.submissions.length > 0 && (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Player</th>
                <th className="px-3 py-2 text-left font-medium">Team</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Details</th>
                <th className="px-3 py-2 text-left font-medium">Source</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Submitted</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.submissions.map((sub) => (
                <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{sub.player_rsn}</td>
                  <td className="px-3 py-2 text-muted-foreground">{teamMap[String(sub.team_id)] ?? sub.team_id}</td>
                  <td className="px-3 py-2 capitalize">{sub.submission_type}</td>
                  <td className="px-3 py-2 text-muted-foreground max-w-xs truncate">{payloadSummary(sub)}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      {SOURCE_LABELS[sub.source] ?? sub.source}
                      {sub.auto_approved && <span className="ml-1 text-green-600">(auto)</span>}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[sub.status]}`}>{sub.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(sub.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {sub.status !== "approved" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700"
                          onClick={() => approve(sub)} disabled={patchMutation.isPending} title="Approve">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {sub.status !== "rejected" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => reject(sub)} disabled={patchMutation.isPending} title="Reject">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(sub)} disabled={deleteMutation.isPending} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => f.setPage((p) => Math.max(0, p - 1))} disabled={f.page === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{f.page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => f.setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={f.page >= totalPages - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
