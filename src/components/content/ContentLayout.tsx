import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, Link, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Menu, Pencil, Plus, Trash2, X } from "lucide-react";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/api/client";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

interface ContentContextValue {
  categories: CategoryTree[];
  refreshTree: () => void;
  pageType: string;
  pageId: string;
  pageName: string;
  routeBase: string;
}

const ContentContext = createContext<ContentContextValue>({
  categories: [],
  refreshTree: () => {},
  pageType: "",
  pageId: "",
  pageName: "",
  routeBase: "",
});

export function useContentContext(): ContentContextValue {
  return useContext(ContentContext);
}

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  pageType: string;
  pageId: string;
  allCategories: CategoryTree[];
  editing?: CategoryTree | null;
  defaultParentId?: string | null;
  onSuccess: () => void;
}

function flattenCategories(
  cats: CategoryTree[],
  depth = 0,
): { id: string; label: string; depth: number }[] {
  const result: { id: string; label: string; depth: number }[] = [];
  for (const cat of cats) {
    result.push({ id: cat.id, label: cat.label, depth });
    result.push(...flattenCategories(cat.children, depth + 1));
  }
  return result;
}

function CategoryDialog({
  open,
  onClose,
  pageType,
  allCategories,
  editing,
  defaultParentId,
  onSuccess,
}: CategoryDialogProps) {
  const [label, setLabel] = useState(editing?.label ?? "");
  const [parentId, setParentId] = useState<string>(
    editing?.parent_id ?? defaultParentId ?? "__root__",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLabel(editing?.label ?? "");
      setParentId(editing?.parent_id ?? defaultParentId ?? "__root__");
      setError(null);
    }
  }, [open, editing, defaultParentId]);

  const flat = flattenCategories(allCategories);

  async function handleSave() {
    const trimmed = label.trim();
    if (!trimmed) {
      setError("Label is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    };

    const resolvedParentId = parentId === "__root__" ? null : parentId;

    try {
      let res: Response;
      if (editing) {
        res = await fetch(`${API_URL}/content/${pageType}/categories/${editing.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            label: trimmed,
            parent_id: resolvedParentId,
          }),
        });
      } else {
        res = await fetch(`${API_URL}/content/${pageType}/categories`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            label: trimmed,
            parent_id: resolvedParentId,
          }),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Failed to save category.");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-label">Label</Label>
            <Input
              id="cat-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Category name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-parent">Parent</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger id="cat-parent">
                <SelectValue placeholder="No parent (root)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__root__">- No parent (root) -</SelectItem>
                {flat
                  .filter((c) => c.id !== editing?.id)
                  .map(({ id, label: catLabel, depth }) => (
                    <SelectItem key={id} value={id}>
                      {"  ".repeat(depth)}
                      {catLabel}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NewEntryDialogProps {
  open: boolean;
  onClose: () => void;
  pageType: string;
  categoryId: string;
  routeBase: string;
  onSuccess: () => void;
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "";
}

function NewEntryDialog({ open, onClose, pageType, categoryId, routeBase, onSuccess }: NewEntryDialogProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTitle("");
      setSlug("");
      setSlugEdited(false);
      setError(null);
    }
  }, [open]);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugEdited) setSlug(slugify(val));
  }

  function handleSlugChange(val: string) {
    setSlug(val);
    setSlugEdited(val !== "" && val !== slugify(title));
  }

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    };

    try {
      const payload: Record<string, string> = { title: trimmed };
      if (slug.trim()) payload.slug = slug.trim();
      const res = await fetch(
        `${API_URL}/content/${pageType}/categories/${categoryId}/entries`,
        { method: "POST", headers, body: JSON.stringify(payload) },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Failed to create entry.");
        return;
      }
      const created = await res.json();
      onSuccess();
      onClose();
      navigate({ to: `${routeBase}/$slug`, params: { slug: created.slug } });
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  const preview = slug || slugify(title);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="entry-title">Title</Label>
            <Input
              id="entry-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Entry title"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="entry-slug">Slug</Label>
            <Input
              id="entry-slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder={slugify(title) || "auto-generated"}
              className="font-mono text-sm"
            />
            {preview && (
              <p className="text-xs text-muted-foreground">URL: <span className="font-mono">{preview}</span></p>
            )}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CategoryNodeProps {
  cat: CategoryTree;
  siblings: CategoryTree[];
  siblingIndex: number;
  allCategories: CategoryTree[];
  pageType: string;
  pageId: string;
  routeBase: string;
  level: number;
  canEdit: boolean;
  canDelete: boolean;
  onRefresh: () => void;
}

async function applyReorder(
  siblings: CategoryTree[],
  fromIndex: number,
  toIndex: number,
  pageType: string,
) {
  const reordered = [...siblings];
  const moved = reordered.splice(fromIndex, 1)[0]!;
  reordered.splice(toIndex, 0, moved);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  await Promise.all(
    reordered.map((c, idx) => {
      if (c.sort_order === idx) return Promise.resolve();
      return fetch(`${API_URL}/content/${pageType}/categories/${c.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ sort_order: idx }),
      });
    }),
  );
}

async function applyEntryReorder(
  entries: ContentEntry[],
  fromIndex: number,
  toIndex: number,
  pageType: string,
) {
  const reordered = [...entries];
  const moved = reordered.splice(fromIndex, 1)[0]!;
  reordered.splice(toIndex, 0, moved);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  await Promise.all(
    reordered.map((e, idx) => {
      if (e.sort_order === idx) return Promise.resolve();
      return fetch(`${API_URL}/content/${pageType}/entries/${e.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ sort_order: idx }),
      });
    }),
  );
}

function CategoryNode({
  cat,
  siblings,
  siblingIndex,
  allCategories,
  pageType,
  pageId,
  routeBase,
  level,
  canEdit,
  canDelete,
  onRefresh,
}: CategoryNodeProps) {
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [entryReordering, setEntryReordering] = useState(false);

  async function handleMoveEntry(direction: "up" | "down", fromIndex: number) {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= cat.entries.length) return;
    setEntryReordering(true);
    try {
      await applyEntryReorder(cat.entries, fromIndex, toIndex, pageType);
      onRefresh();
    } finally {
      setEntryReordering(false);
    }
  }

  async function handleMove(direction: "up" | "down") {
    const toIndex = direction === "up" ? siblingIndex - 1 : siblingIndex + 1;
    if (toIndex < 0 || toIndex >= siblings.length) return;
    setReordering(true);
    try {
      await applyReorder(siblings, siblingIndex, toIndex, pageType);
      onRefresh();
    } finally {
      setReordering(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete category "${cat.label}" and all its contents? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`${API_URL}/content/${pageType}/categories/${cat.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      onRefresh();
    } finally {
      setDeleting(false);
    }
  }

  const paddingLeft = 8 + level * 12;

  return (
    <div className="mb-1">
      <div
        className="relative flex items-center py-1 pr-1 text-sm hover:bg-muted/50 rounded-sm group cursor-pointer select-none"
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => setOpen(!open)}
      >
        <span className="shrink-0 p-0.5 text-muted-foreground/60">
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </span>
        <span className={cn(
          "flex-1 truncate font-medium uppercase tracking-wide min-w-0",
          level === 0
            ? "text-primary text-sm"
            : "text-muted-foreground text-[13px]",
        )}>
          {cat.label}
        </span>
        {(canEdit || canDelete) && (
          <div className="absolute right-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 bg-card/95 rounded px-0.5">
            {canEdit && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handleMove("up"); }}
                  disabled={reordering || siblingIndex === 0}
                  className="p-0.5 text-primary/50 hover:text-primary disabled:opacity-0"
                  title="Move up"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleMove("down"); }}
                  disabled={reordering || siblingIndex === siblings.length - 1}
                  className="p-0.5 text-primary/50 hover:text-primary disabled:opacity-0"
                  title="Move down"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditDialogOpen(true); }}
                  className="p-0.5 text-primary/50 hover:text-primary"
                  title="Edit category"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </>
            )}
            {canDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                disabled={deleting}
                className="p-0.5 text-primary/50 hover:text-destructive"
                title="Delete category"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {open && (
        <>
          {cat.children.map((child, idx) => (
            <CategoryNode
              key={child.id}
              cat={child}
              siblings={cat.children}
              siblingIndex={idx}
              allCategories={allCategories}
              pageType={pageType}
              pageId={pageId}
              routeBase={routeBase}
              level={level + 1}
              canEdit={canEdit}
              canDelete={canDelete}
              onRefresh={onRefresh}
            />
          ))}
          {cat.entries.map((entry, entryIdx) => (
            <div
              key={entry.id}
              className="relative group/entry hover:bg-muted/50 rounded-sm"
              style={{ paddingLeft: `${paddingLeft + 20}px` }}
            >
              <Link
                // @ts-expect-error -- routeBase is dynamic, TanStack Router cannot validate statically
                to={`${routeBase}/$slug`}
                params={{ slug: entry.slug }}
                className="block text-[13px] leading-snug text-muted-foreground hover:text-foreground [&.active]:text-primary [&.active]:font-medium py-1 pr-1"
              >
                {entry.title}
              </Link>
              {canEdit && (
                <div className="absolute right-0 top-0 bottom-0 flex items-center gap-0.5 opacity-0 group-hover/entry:opacity-100 bg-card/95 rounded px-0.5">
                  <button
                    onClick={() => handleMoveEntry("up", entryIdx)}
                    disabled={entryReordering || entryIdx === 0}
                    className="p-0.5 text-primary/50 hover:text-primary disabled:opacity-0"
                    title="Move up"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleMoveEntry("down", entryIdx)}
                    disabled={entryReordering || entryIdx === cat.entries.length - 1}
                    className="p-0.5 text-primary/50 hover:text-primary disabled:opacity-0"
                    title="Move down"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {canEdit && (
            <button
              onClick={() => setNewEntryDialogOpen(true)}
              className="flex items-center gap-1 text-[13px] text-muted-foreground/50 hover:text-muted-foreground py-1"
              style={{ paddingLeft: `${paddingLeft + 20}px` }}
            >
              <Plus className="h-3 w-3" />
              New entry
            </button>
          )}
        </>
      )}

      <CategoryDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        pageType={pageType}
        pageId={pageId}
        allCategories={allCategories}
        editing={cat}
        onSuccess={onRefresh}
      />
      <NewEntryDialog
        open={newEntryDialogOpen}
        onClose={() => setNewEntryDialogOpen(false)}
        pageType={pageType}
        categoryId={cat.id}
        routeBase={routeBase}
        onSuccess={onRefresh}
      />
    </div>
  );
}

interface SidebarContentProps {
  categories: CategoryTree[];
  pageType: string;
  pageId: string;
  pageName: string;
  routeBase: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onRefresh: () => void;
  onNavigate?: () => void;
}

function SidebarContent({
  categories,
  pageType,
  pageId,
  pageName,
  routeBase,
  canCreate,
  canEdit,
  canDelete,
  onRefresh,
}: SidebarContentProps) {
  const [newCatDialogOpen, setNewCatDialogOpen] = useState(false);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3 shrink-0">
        <Link
          to={routeBase}
          className="text-sm font-semibold text-foreground hover:text-primary truncate"
        >
          {pageName}
        </Link>
        {canCreate && (
          <button
            onClick={() => setNewCatDialogOpen(true)}
            className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="New category"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {categories.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground/60">No categories yet.</p>
        ) : (
          categories.map((cat, idx) => (
            <CategoryNode
              key={cat.id}
              cat={cat}
              siblings={categories}
              siblingIndex={idx}
              allCategories={categories}
              pageType={pageType}
              pageId={pageId}
              routeBase={routeBase}
              level={0}
              canEdit={canEdit}
              canDelete={canDelete}
              onRefresh={onRefresh}
            />
          ))
        )}
      </div>

      <CategoryDialog
        open={newCatDialogOpen}
        onClose={() => setNewCatDialogOpen(false)}
        pageType={pageType}
        pageId={pageId}
        allCategories={categories}
        onSuccess={onRefresh}
      />
    </div>
  );
}

interface ContentLayoutProps {
  pageType: string;
  pageName: string;
  pageId: string;
  routeBase: string;
}

export function ContentLayout({ pageType, pageName, pageId, routeBase }: ContentLayoutProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = user?.effective_roles ?? [];

  const canCreate = hasPermission(pageId, "create", effectiveRoles);
  const canEdit = hasPermission(pageId, "edit", effectiveRoles);
  const canDelete = hasPermission(pageId, "delete", effectiveRoles);

  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    apiFetch<CategoryTree[]>(`/content/${pageType}/categories`)
      .then(setCategories)
      .catch(() => {});
  }, [pageType, refreshKey]);

  const refreshTree = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const sidebarProps: SidebarContentProps = {
    categories,
    pageType,
    pageId,
    pageName,
    routeBase,
    canCreate,
    canEdit,
    canDelete,
    onRefresh: refreshTree,
  };

  const contextValue = useMemo(
    () => ({ categories, refreshTree, pageType, pageId, pageName, routeBase }),
    [categories, refreshTree, pageType, pageId, pageName, routeBase],
  );

  return (
    <ContentContext.Provider value={contextValue}>
      <div className="flex h-full -m-6">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col overflow-hidden">
          <SidebarContent {...sidebarProps} />
        </aside>

        <div className="fixed bottom-4 left-4 z-40 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shadow-md">
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col w-64 border-border bg-card pt-4 gap-0 p-0">
              <SidebarContent {...sidebarProps} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-6">
          <Outlet />
        </div>
      </div>
    </ContentContext.Provider>
  );
}
