import { apiFetch } from "./client";

interface SurveyTemplate {
  template_id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  is_visible: boolean;
  questions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface SurveyResponse {
  response_id: string;
  submitted_at: string;
  answers: Record<string, unknown>;
}

export const surveysApi = {
  list: () => apiFetch<SurveyTemplate[]>("/surveys"),

  listApplications: () => apiFetch<SurveyTemplate[]>("/surveys/applications"),

  getTemplate: (templateId: string) =>
    apiFetch<SurveyTemplate>(`/surveys/${templateId}`),

  getResponses: (templateId: string) =>
    apiFetch<SurveyResponse[]>(`/surveys/${templateId}/responses`),

  submit: (templateId: string, answers: Record<string, unknown>) =>
    apiFetch<void>(`/surveys/${templateId}/responses`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  setVisibility: (templateId: string, visible: boolean) =>
    apiFetch<void>(`/surveys/${templateId}/visibility`, {
      method: "PUT",
      body: JSON.stringify({ visible }),
    }),

  setOpen: (templateId: string, open: boolean) =>
    apiFetch<void>(`/surveys/${templateId}/open`, {
      method: "PUT",
      body: JSON.stringify({ open }),
    }),

  create: (data: Omit<SurveyTemplate, "template_id">) =>
    apiFetch<SurveyTemplate>("/surveys", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (templateId: string, data: Partial<SurveyTemplate>) =>
    apiFetch<SurveyTemplate>(`/surveys/${templateId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (templateId: string) =>
    apiFetch<void>(`/surveys/${templateId}`, { method: "DELETE" }),
};
