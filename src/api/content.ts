import { apiFetch } from "./client";
import type { EntryDetail, ContentCategory } from "@/types/content";

interface CategoryTree extends ContentCategory {
  children: CategoryTree[];
  entry_count: number;
}

interface EntryListItem {
  id: string;
  title: string;
  slug: string;
  category_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface CreateEntryPayload {
  title: string;
  body: string;
  category_id: string | null;
}

interface UpdateEntryPayload {
  title?: string;
  body?: string;
  category_id?: string | null;
}

interface CreateCategoryPayload {
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  order?: number;
}

export const contentApi = {
  getCategories: (pageType: string) =>
    apiFetch<CategoryTree[]>(`/content/${pageType}/categories`),

  getEntryBySlug: (pageType: string, slug: string) =>
    apiFetch<EntryDetail>(`/content/${pageType}/entries/by-slug/${slug}`),

  getEntryById: (pageType: string, id: string) =>
    apiFetch<EntryDetail>(`/content/${pageType}/entries/${id}`),

  listEntries: (pageType: string, categoryId?: string) =>
    apiFetch<EntryListItem[]>(
      `/content/${pageType}/entries${categoryId ? `?category_id=${categoryId}` : ""}`,
    ),

  createEntry: (pageType: string, data: CreateEntryPayload) =>
    apiFetch<EntryDetail>(`/content/${pageType}/entries`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateEntry: (pageType: string, id: string, data: UpdateEntryPayload) =>
    apiFetch<EntryDetail>(`/content/${pageType}/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteEntry: (pageType: string, id: string) =>
    apiFetch<void>(`/content/${pageType}/entries/${id}`, { method: "DELETE" }),

  reactToEntry: (pageType: string, id: string) =>
    apiFetch<void>(`/content/${pageType}/entries/${id}/react`, { method: "POST" }),

  createCategory: (pageType: string, data: CreateCategoryPayload) =>
    apiFetch<ContentCategory>(`/content/${pageType}/categories`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCategory: (pageType: string, id: string, data: Partial<CreateCategoryPayload>) =>
    apiFetch<ContentCategory>(`/content/${pageType}/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCategory: (pageType: string, id: string) =>
    apiFetch<void>(`/content/${pageType}/categories/${id}`, { method: "DELETE" }),
};
