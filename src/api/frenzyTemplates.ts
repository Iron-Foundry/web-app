import { apiFetch } from "@/api/client";
import type { FrenzyTemplate, FrenzyTemplateSummary, FrenzyTemplateUpdate, FrenzyVersionDetail, FrenzyVersionSummary } from "@/types/frenzyTemplate";

export const frenzyTemplatesApi = {
  listTemplates: () => apiFetch<FrenzyTemplateSummary[]>("/frenzy/templates"),
  createTemplate: (data: FrenzyTemplateUpdate) =>
    apiFetch<{ id: number; version_number: number }>("/frenzy/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getTemplate: (id: number) => apiFetch<FrenzyTemplate>(`/frenzy/templates/${id}`),
  updateTemplate: (id: number, data: FrenzyTemplateUpdate) =>
    apiFetch<{ id: number; version_number: number; updated_at: string }>(
      `/frenzy/templates/${id}`,
      { method: "PUT", body: JSON.stringify(data) },
    ),
  deleteTemplate: (id: number) =>
    apiFetch<{ ok: boolean }>(`/frenzy/templates/${id}`, { method: "DELETE" }),
  listTemplateVersions: (id: number) =>
    apiFetch<FrenzyVersionSummary[]>(`/frenzy/templates/${id}/versions`),
  getTemplateVersion: (id: number, vid: number) =>
    apiFetch<FrenzyVersionDetail>(`/frenzy/templates/${id}/versions/${vid}`),
  revertTemplate: (id: number, vid: number) =>
    apiFetch<{ id: number; version_number: number; updated_at: string }>(
      `/frenzy/templates/${id}/revert/${vid}`,
      { method: "POST" },
    ),
};
