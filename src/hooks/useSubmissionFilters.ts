import { useEffect, useState } from "react";
import type { SubmissionFilters } from "@/hooks/useFrenzy";

const PAGE_SIZE = 50;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export interface SubmissionFilterState {
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  search: string;
  setSearch: (v: string) => void;
  playerRsn: string;
  setPlayerRsn: (v: string) => void;
  teamFilter: string;
  setTeamFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  sourceFilter: string;
  setSourceFilter: (v: string) => void;
  autoApprovedFilter: string;
  setAutoApprovedFilter: (v: string) => void;
  submittedAfter: string;
  setSubmittedAfter: (v: string) => void;
  submittedBefore: string;
  setSubmittedBefore: (v: string) => void;
  debouncedSearch: string;
  debouncedPlayerRsn: string;
  params: SubmissionFilters;
  activeFilterCount: number;
  clearAllFilters: () => void;
  resetPage: () => void;
}

export function useSubmissionFilters(): SubmissionFilterState {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [playerRsn, setPlayerRsn] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [autoApprovedFilter, setAutoApprovedFilter] = useState("");
  const [submittedAfter, setSubmittedAfter] = useState("");
  const [submittedBefore, setSubmittedBefore] = useState("");

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

  const activeFilterCount = [
    teamFilter, statusFilter, typeFilter, sourceFilter,
    autoApprovedFilter, submittedAfter, submittedBefore, debouncedPlayerRsn,
  ].filter(Boolean).length;

  function resetPage() { setPage(0); }

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

  return {
    page, setPage,
    search, setSearch,
    playerRsn, setPlayerRsn,
    teamFilter, setTeamFilter,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    sourceFilter, setSourceFilter,
    autoApprovedFilter, setAutoApprovedFilter,
    submittedAfter, setSubmittedAfter,
    submittedBefore, setSubmittedBefore,
    debouncedSearch, debouncedPlayerRsn,
    params, activeFilterCount,
    clearAllFilters, resetPage,
  };
}

export { PAGE_SIZE };
