import { API_URL, getAuthHeaders } from "@/context/AuthContext";

export interface ContentEntry {
  id: string;
  title: string;
  slug: string;
  sort_order: number;
}

export interface CategoryTree {
  id: string;
  label: string;
  slug: string;
  sort_order: number;
  parent_id: string | null;
  children: CategoryTree[];
  entries: ContentEntry[];
}

export interface FlatCategory {
  cat: CategoryTree;
  depth: number;
  trail: string[];
  siblings: CategoryTree[];
  siblingIndex: number;
}

export interface FlatEntry {
  entry: ContentEntry;
  trail: string[];
  categoryId: string;
}

export function flattenCategories(
  cats: CategoryTree[],
  depth = 0,
  trail: string[] = [],
): FlatCategory[] {
  const result: FlatCategory[] = [];
  cats.forEach((cat, siblingIndex) => {
    const nextTrail = [...trail, cat.label];
    result.push({ cat, depth, trail: nextTrail, siblings: cats, siblingIndex });
    result.push(...flattenCategories(cat.children, depth + 1, nextTrail));
  });
  return result;
}

export function flattenEntries(cats: CategoryTree[], trail: string[] = []): FlatEntry[] {
  const result: FlatEntry[] = [];
  for (const cat of cats) {
    const nextTrail = [...trail, cat.label];
    for (const entry of cat.entries) {
      result.push({ entry, trail: nextTrail, categoryId: cat.id });
    }
    result.push(...flattenEntries(cat.children, nextTrail));
  }
  return result;
}

export function findCategoryIdForSlug(cats: CategoryTree[], slug: string): string | null {
  return flattenEntries(cats).find((f) => f.entry.slug === slug)?.categoryId ?? null;
}

function reorderIds<T extends { id: string; sort_order: number }>(
  items: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const reordered = [...items];
  const moved = reordered.splice(fromIndex, 1)[0]!;
  reordered.splice(toIndex, 0, moved);
  return reordered;
}

async function patchSortOrders<T extends { id: string; sort_order: number }>(
  reordered: T[],
  url: (item: T) => string,
  method: "PATCH" | "PUT",
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  await Promise.all(
    reordered.map((item, idx) => {
      if (item.sort_order === idx) return Promise.resolve();
      return fetch(url(item), {
        method,
        headers,
        body: JSON.stringify({ sort_order: idx }),
      });
    }),
  );
}

export async function moveCategory(
  siblings: CategoryTree[],
  fromIndex: number,
  toIndex: number,
  pageType: string,
): Promise<void> {
  if (toIndex < 0 || toIndex >= siblings.length) return;
  await patchSortOrders(
    reorderIds(siblings, fromIndex, toIndex),
    (c) => `${API_URL}/content/${pageType}/categories/${c.id}`,
    "PATCH",
  );
}

export async function moveEntry(
  entries: ContentEntry[],
  fromIndex: number,
  toIndex: number,
  pageType: string,
): Promise<void> {
  if (toIndex < 0 || toIndex >= entries.length) return;
  await patchSortOrders(
    reorderIds(entries, fromIndex, toIndex),
    (e) => `${API_URL}/content/${pageType}/entries/${e.id}`,
    "PUT",
  );
}

export async function deleteCategory(pageType: string, categoryId: string): Promise<void> {
  await fetch(`${API_URL}/content/${pageType}/categories/${categoryId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}
