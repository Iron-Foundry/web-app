import { createContext, useContext, useEffect, useState } from "react";
import { Outlet, Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Menu, Pencil, Plus, Trash2, X } from "lucide-react";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContentEntry {
  id: string;
  title: string;
  slug: string;
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
}

const ContentContext = createContext<ContentContextValue>({
  categories: [],
  refreshTree: () => {},
  pageType: "",
  pageId: "",
  pageName: "",
});

export function useContentContext(): ContentContextValue {
  return useContext(ContentContext);
}

// ── Category dialog ───────────────────────────────────────────────────────────

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
  const [sortOrder, setSortOrder] = useState(String(editing?.sort_order ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLabel(editing?.label ?? "");
      setParentId(editing?.parent_id ?? defaultParentId ?? "__root__");
      setSortOrder(String(editing?.sort_order ?? 0));
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
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
            sort_order: Number(sortOrder) || 0,
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
                <SelectItem value="__root__">— No parent (root) —</SelectItem>
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
          {editing && (
            <div className="space-y-1.5">
              <Label htmlFor="cat-sort">Sort order</Label>
              <Input
                id="cat-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          )}
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

// ── New entry dialog ──────────────────────────────────────────────────────────

interface NewEntryDialogProps {
  open: boolean;
  onClose: () => void;
  pageType: string;
  categoryId: string;
  routeBase: string;
  onSuccess: () => void;
}

function NewEntryDialog({ open, onClose, pageType, categoryId, routeBase, onSuccess }: NewEntryDialogProps) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTitle("");
      setError(null);
    }
  }, [open]);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch(
        `${API_URL}/content/${pageType}/categories/${categoryId}/entries`,
        { method: "POST", headers, body: JSON.stringify({ title: trimmed }) },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Failed to create entry.");
        return;
      }
      const created = await res.json();
      onSuccess();
      onClose();
      // Navigate to the new entry — it will auto-enter edit mode (empty body)
      navigate({ to: `${routeBase}/$entryId`, params: { entryId: created.id } });
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
          <DialogTitle>New Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="entry-title">Title</Label>
            <Input
              id="entry-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
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

// ── CategoryNode ──────────────────────────────────────────────────────────────

interface CategoryNodeProps {
  cat: CategoryTree;
  allCategories: CategoryTree[];
  pageType: string;
  pageId: string;
  routeBase: string;
  level: number;
  canEdit: boolean;
  canDelete: boolean;
  onRefresh: () => void;
}

function CategoryNode({
  cat,
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

  async function handleDelete() {
    if (!confirm(`Delete category "${cat.label}" and all its contents? This cannot be undone.`)) return;
    setDeleting(true);
    const token = getAuthToken();
    try {
      await fetch(`${API_URL}/content/${pageType}/categories/${cat.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      onRefresh();
    } finally {
      setDeleting(false);
    }
  }

  const paddingLeft = 8 + level * 12;

  return (
    <div>
      <div
        className="flex items-center gap-0.5 py-1 pr-1 text-sm hover:bg-muted/50 rounded-sm group"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <button
          onClick={() => setOpen(!open)}
          className="shrink-0 p-0.5 text-muted-foreground/60 hover:text-muted-foreground"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        <span className="flex-1 text-muted-foreground truncate text-xs font-medium uppercase tracking-wide">
          {cat.label}
        </span>
        {canEdit && (
          <button
            onClick={() => setEditDialogOpen(true)}
            className="shrink-0 p-0.5 text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover:opacity-100"
            title="Edit category"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 p-0.5 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100"
            title="Delete category"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && (
        <>
          {cat.children.map((child) => (
            <CategoryNode
              key={child.id}
              cat={child}
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
          {cat.entries.map((entry) => (
            <Link
              key={entry.id}
              to={`${routeBase}/$entryId`}
              params={{ entryId: entry.id }}
              className="block text-xs truncate text-muted-foreground hover:text-foreground [&.active]:text-primary [&.active]:font-medium py-1 pr-2 rounded-sm hover:bg-muted/50"
              style={{ paddingLeft: `${paddingLeft + 20}px` }}
            >
              {entry.title}
            </Link>
          ))}
          {canEdit && (
            <button
              onClick={() => setNewEntryDialogOpen(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground py-1"
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

// ── Sidebar content ───────────────────────────────────────────────────────────

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
          categories.map((cat) => (
            <CategoryNode
              key={cat.id}
              cat={cat}
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

// ── ContentLayout (exported) ──────────────────────────────────────────────────

interface ContentLayoutProps {
  pageType: string;
  pageName: string;
  pageId: string;
  /** Base path like "/plugins" or "/resources" */
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
    fetch(`${API_URL}/content/${pageType}/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories)
      .catch(() => {});
  }, [pageType, refreshKey]);

  function refreshTree() {
    setRefreshKey((k) => k + 1);
  }

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

  return (
    <ContentContext.Provider value={{ categories, refreshTree, pageType, pageId, pageName }}>
      <div className="flex flex-1 min-h-0 -m-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col overflow-hidden">
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Mobile sidebar trigger */}
        <div className="fixed bottom-4 left-4 z-40 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shadow-md">
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col w-56 border-border bg-card pt-4 gap-0 p-0">
              <SidebarContent {...sidebarProps} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Page content */}
        <div className="flex-1 min-h-0 overflow-auto p-6">
          <Outlet />
        </div>
      </div>
    </ContentContext.Provider>
  );
}
