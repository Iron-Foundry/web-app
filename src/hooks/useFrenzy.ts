import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { frenzyApi } from "@/api/frenzy";
import { queryKeys } from "@/lib/queryKeys";
import type { FrenzySubmissionCreate, FrenzyTemplateUpdate } from "@/types/frenzy";

const STALE_5M = 1000 * 60 * 5;
const STALE_24H = 1000 * 60 * 60 * 24;

// Public
export function useActiveEvent() {
  return useQuery({
    queryKey: queryKeys.frenzy.active(),
    queryFn: frenzyApi.getActiveEvent,
    staleTime: STALE_5M,
  });
}

export function useTeamDetail(teamSlug: string) {
  return useQuery({
    queryKey: queryKeys.frenzy.team(teamSlug),
    queryFn: () => frenzyApi.getTeamDetail(teamSlug),
    staleTime: STALE_5M,
    enabled: !!teamSlug,
  });
}

export function useFrenzyLeaderboards() {
  return useQuery({
    queryKey: queryKeys.frenzy.leaderboards(),
    queryFn: frenzyApi.getLeaderboards,
    staleTime: STALE_5M,
  });
}

// OSRS reference data
export function useOsrsItems(q: string) {
  return useQuery({
    queryKey: queryKeys.frenzy.osrsItems(q),
    queryFn: () => frenzyApi.searchItems(q),
    staleTime: STALE_24H,
    enabled: q.length >= 2,
  });
}

export function useOsrsBosses() {
  return useQuery({
    queryKey: queryKeys.frenzy.osrsBosses(),
    queryFn: frenzyApi.getBosses,
    staleTime: STALE_24H,
  });
}

export function useOsrsActivities() {
  return useQuery({
    queryKey: queryKeys.frenzy.osrsActivities(),
    queryFn: frenzyApi.getActivities,
    staleTime: STALE_24H,
  });
}

// Admin - Templates
export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.frenzy.templates(),
    queryFn: frenzyApi.listTemplates,
    staleTime: STALE_5M,
  });
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: queryKeys.frenzy.template(id),
    queryFn: () => frenzyApi.getTemplate(id),
    staleTime: STALE_5M,
    enabled: id > 0,
  });
}

export function useTemplateVersions(id: number) {
  return useQuery({
    queryKey: queryKeys.frenzy.templateVersions(id),
    queryFn: () => frenzyApi.listTemplateVersions(id),
    staleTime: STALE_5M,
    enabled: id > 0,
  });
}

export function useTemplateVersion(id: number, vid: number) {
  return useQuery({
    queryKey: queryKeys.frenzy.templateVersion(id, vid),
    queryFn: () => frenzyApi.getTemplateVersion(id, vid),
    staleTime: STALE_24H,
    enabled: id > 0 && vid > 0,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FrenzyTemplateUpdate) => frenzyApi.createTemplate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.frenzy.templates() }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FrenzyTemplateUpdate }) =>
      frenzyApi.updateTemplate(id, data),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.templates() });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.template(id) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.templateVersions(id) });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => frenzyApi.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.frenzy.templates() }),
  });
}

export function useRevertTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vid }: { id: number; vid: number }) => frenzyApi.revertTemplate(id, vid),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.template(id) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.templateVersions(id) });
    },
  });
}

// Admin - Events
export function useEvents() {
  return useQuery({
    queryKey: queryKeys.frenzy.events(),
    queryFn: frenzyApi.listEvents,
    staleTime: STALE_5M,
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: queryKeys.frenzy.event(id),
    queryFn: () => frenzyApi.getEvent(id),
    staleTime: STALE_5M,
    enabled: id > 0,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: frenzyApi.createEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.frenzy.events() }),
  });
}

export function usePatchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof frenzyApi.patchEvent>[1] }) =>
      frenzyApi.patchEvent(id, data),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.events() });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(id) });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => frenzyApi.deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.events() });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}

export function useActivateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => frenzyApi.activateEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.events() });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}

export function useDeactivateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => frenzyApi.deactivateEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.events() });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}

export function useAddTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      data,
    }: {
      eventId: number;
      data: Parameters<typeof frenzyApi.addTeam>[1];
    }) => frenzyApi.addTeam(eventId, data),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}

export function usePatchTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      slug,
      data,
    }: {
      eventId: number;
      slug: string;
      data: Parameters<typeof frenzyApi.patchTeam>[2];
    }) => frenzyApi.patchTeam(eventId, slug, data),
    onSuccess: (_result, { eventId, slug }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.team(slug) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, slug }: { eventId: number; slug: string }) =>
      frenzyApi.deleteTeam(eventId, slug),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}

export function useSyncEventFromWom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) => frenzyApi.syncEventFromWom(eventId),
    onSuccess: (_result, eventId) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.events() });
    },
  });
}

// History / charts

export function useTeamHistory(teamSlug: string) {
  return useQuery({
    queryKey: queryKeys.frenzy.teamHistory(teamSlug),
    queryFn: () => frenzyApi.getTeamHistory(teamSlug),
    staleTime: STALE_5M,
    enabled: !!teamSlug,
  });
}

export function useEventHistory() {
  return useQuery({
    queryKey: queryKeys.frenzy.eventHistory(),
    queryFn: frenzyApi.getEventHistory,
    staleTime: STALE_5M,
  });
}

// Admin - Submissions

export interface SubmissionFilters {
  team_id?: number;
  status?: string;
  submission_type?: string;
  source?: string;
  player_rsn?: string;
  auto_approved?: boolean;
  submitted_after?: string;
  submitted_before?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export function useSubmissions(eventId: number, params?: SubmissionFilters) {
  const paramsKey = JSON.stringify(params ?? {});
  return useQuery({
    queryKey: queryKeys.frenzy.submissions(eventId, paramsKey),
    queryFn: () => frenzyApi.listSubmissions(eventId, params),
    staleTime: STALE_5M,
    enabled: eventId > 0,
  });
}

function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: FrenzySubmissionCreate }) =>
      frenzyApi.createSubmission(eventId, data),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.submissions(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}

export function usePatchSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      submissionId,
      data,
    }: {
      eventId: number;
      submissionId: number;
      data: { status: string; review_notes?: string | null };
    }) => frenzyApi.patchSubmission(eventId, submissionId, data),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.submissions(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
      qc.invalidateQueries({ queryKey: ["frenzy", "active"] });
    },
  });
}

export function useDeleteSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, submissionId }: { eventId: number; submissionId: number }) =>
      frenzyApi.deleteSubmission(eventId, submissionId),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.submissions(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
    },
  });
}
