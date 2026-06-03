import { useEffect, useState } from "react";
import { Check, X, Trash2, ChevronLeft, ChevronRight, Search, SlidersHorizontal, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSubmissions, usePatchSubmission, useDeleteSubmission } from "@/hooks/useFrenzy";
import type { SubmissionFilters } from "@/hooks/useFrenzy";
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

const PAGE_SIZE = 50;

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

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type FilterKey = keyof Omit<SubmissionFilters, "limit" | "offset">;

function FilterSelect({
  label,
  value,
  onChange,
  options,
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
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function FrenzySubmissionFeed({ eventId, teams }: Props) {
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Raw filter state (UI)
  const [search, setSearch] = useState("");
  const [playerRsn, setPlayerRsn] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [autoApprovedFilter, setAutoApprovedFilter] = useState("");
  const [submittedAfter, setSubmittedAfter] = useState("");
  const [submittedBefore, setSubmittedBefore] = useState("");

  // Debounced text fields
  const debouncedSearch = useDebounce(search, 300);
  const debouncedPlayerRsn = useDebounce(playerRsn, 300);

  const params: SubmissionFilters = {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    ...(teamFilter && { team_id: Number(teamFilter) }),
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { submission_type: typeFilter }),
    ...(sourceFilter && { source: sourceFilter }),
    ...(debouncedPlayerRsn && { player_rsn: debouncedPlayerRsn }),
    ...(autoApprovedFilter && { auto_approved: autoApprovedFilter === "true" }),
    ...(submittedAfter && { submitted_after: new Date(submittedAfter).toISOString() }),
    ...(submittedBefore && { submitted_before: new Date(submittedBefore + "T23:59:59").toISOString() }),
    ...(debouncedSearch && { q: debouncedSearch }),
  };

  const { data, isLoading } = useSubmissions(eventId, params);
  const patchMutation = usePatchSubmission();
  const deleteMutation = useDeleteSubmission();

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;
  const teamMap = Object.fromEntries(teams.map((t) => [String(t.id), t.name]));

  // Count active filters (excluding pagination and search which has its own bar)
  const activeFilterCount = [
    teamFilter, statusFilter, typeFilter, sourceFilter,
    autoApprovedFilter, submittedAfter, submittedBefore, debouncedPlayerRsn,
  ].filter(Boolean).length;

  function clearAllFilters() {
    setTeamFilter("");
    setStatusFilter("");
    setTypeFilter("");
    setSourceFilter("");
    setAutoApprovedFilter("");
    setSubmittedAfter("");
    setSubmittedBefore("");
    setPlayerRsn("");
    setSearch("");
    setPage(0);
  }

  function resetPage() { setPage(0); }

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
      {/* Search bar + filter toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search player, item, boss, activity..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          />
          {search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => { setSearch(""); resetPage(); }}
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {(activeFilterCount > 0 || search) && (
          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={clearAllFilters}>
            Clear all
          </Button>
        )}

        {data && (
          <span className="text-sm text-muted-foreground ml-auto">
            {data.total.toLocaleString()} result{data.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="rounded-lg border bg-muted/20 p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Player RSN */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Player RSN</label>
            <Input
              className="h-8 text-sm"
              placeholder="e.g. Zezima"
              value={playerRsn}
              onChange={(e) => { setPlayerRsn(e.target.value); resetPage(); }}
            />
          </div>

          <FilterSelect
            label="Team"
            value={teamFilter}
            onChange={(v) => { setTeamFilter(v); resetPage(); }}
            options={teams.map((t) => ({ value: String(t.id), label: t.name }))}
          />

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); resetPage(); }}
            options={[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ]}
          />

          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v); resetPage(); }}
            options={[
              { value: "item", label: "Item" },
              { value: "activity", label: "Activity" },
              { value: "milestone", label: "Milestone" },
            ]}
          />

          <FilterSelect
            label="Source"
            value={sourceFilter}
            onChange={(v) => { setSourceFilter(v); resetPage(); }}
            options={[
              { value: "trackscape", label: "Trackscape" },
              { value: "discord_ocr", label: "Discord OCR" },
              { value: "discord_manual", label: "Discord Manual" },
              { value: "web", label: "Web" },
            ]}
          />

          <FilterSelect
            label="Auto-approved"
            value={autoApprovedFilter}
            onChange={(v) => { setAutoApprovedFilter(v); resetPage(); }}
            options={[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ]}
          />

          {/* Date range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Submitted after</label>
            <input
              type="date"
              className="text-sm border rounded px-2 py-1.5 bg-background h-8"
              value={submittedAfter}
              onChange={(e) => { setSubmittedAfter(e.target.value); resetPage(); }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Submitted before</label>
            <input
              type="date"
              className="text-sm border rounded px-2 py-1.5 bg-background h-8"
              value={submittedBefore}
              onChange={(e) => { setSubmittedBefore(e.target.value); resetPage(); }}
            />
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {teamFilter && (
            <Chip label={`Team: ${teamMap[teamFilter] ?? teamFilter}`} onRemove={() => { setTeamFilter(""); resetPage(); }} />
          )}
          {statusFilter && (
            <Chip label={`Status: ${statusFilter}`} onRemove={() => { setStatusFilter(""); resetPage(); }} />
          )}
          {typeFilter && (
            <Chip label={`Type: ${typeFilter}`} onRemove={() => { setTypeFilter(""); resetPage(); }} />
          )}
          {sourceFilter && (
            <Chip label={`Source: ${SOURCE_LABELS[sourceFilter] ?? sourceFilter}`} onRemove={() => { setSourceFilter(""); resetPage(); }} />
          )}
          {debouncedPlayerRsn && (
            <Chip label={`Player: ${debouncedPlayerRsn}`} onRemove={() => { setPlayerRsn(""); resetPage(); }} />
          )}
          {autoApprovedFilter && (
            <Chip label={`Auto-approved: ${autoApprovedFilter === "true" ? "Yes" : "No"}`} onRemove={() => { setAutoApprovedFilter(""); resetPage(); }} />
          )}
          {submittedAfter && (
            <Chip label={`After: ${submittedAfter}`} onRemove={() => { setSubmittedAfter(""); resetPage(); }} />
          )}
          {submittedBefore && (
            <Chip label={`Before: ${submittedBefore}`} onRemove={() => { setSubmittedBefore(""); resetPage(); }} />
          )}
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
                      {sub.auto_approved && (
                        <span className="ml-1 text-green-600">(auto)</span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${STATUS_COLORS[sub.status]}`}
                    >
                      {sub.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(sub.submitted_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {sub.status !== "approved" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-600 hover:text-green-700"
                          onClick={() => approve(sub)}
                          disabled={patchMutation.isPending}
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {sub.status !== "rejected" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => reject(sub)}
                          disabled={patchMutation.isPending}
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(sub)}
                        disabled={deleteMutation.isPending}
                        title="Delete"
                      >
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
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
