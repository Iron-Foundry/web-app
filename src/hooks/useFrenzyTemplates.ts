import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { frenzyTemplatesApi } from "@/api/frenzyTemplates";
import { queryKeys } from "@/lib/queryKeys";
import type { FrenzyTemplateUpdate } from "@/types/frenzyTemplate";

const STALE_5M = 1000 * 60 * 5;
const STALE_24H = 1000 * 60 * 60 * 24;

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.frenzy.templates(),
    queryFn: frenzyTemplatesApi.listTemplates,
    staleTime: STALE_5M,
  });
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: queryKeys.frenzy.template(id),
    queryFn: () => frenzyTemplatesApi.getTemplate(id),
    staleTime: STALE_5M,
    enabled: id > 0,
  });
}

export function useTemplateVersions(id: number) {
  return useQuery({
    queryKey: queryKeys.frenzy.templateVersions(id),
    queryFn: () => frenzyTemplatesApi.listTemplateVersions(id),
    staleTime: STALE_5M,
    enabled: id > 0,
  });
}

export function useTemplateVersion(id: number, vid: number) {
  return useQuery({
    queryKey: queryKeys.frenzy.templateVersion(id, vid),
    queryFn: () => frenzyTemplatesApi.getTemplateVersion(id, vid),
    staleTime: STALE_24H,
    enabled: id > 0 && vid > 0,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FrenzyTemplateUpdate) => frenzyTemplatesApi.createTemplate(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.templates() }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FrenzyTemplateUpdate }) =>
      frenzyTemplatesApi.updateTemplate(id, data),
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
    mutationFn: (id: number) => frenzyTemplatesApi.deleteTemplate(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.templates() }),
  });
}

export function useRevertTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vid }: { id: number; vid: number }) =>
      frenzyTemplatesApi.revertTemplate(id, vid),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.template(id) });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.templateVersions(id) });
    },
  });
}
