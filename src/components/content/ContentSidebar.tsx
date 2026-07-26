import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { CategoryRowMenu, EntryRowMenu } from "./ContentRowMenu";
import { CategoryDialog } from "./dialogs/CategoryDialog";
import { NewEntryDialog } from "./dialogs/NewEntryDialog";
import {
  deleteCategory,
  flattenCategories,
  moveCategory,
  moveEntry,
  type CategoryTree,
} from "@/lib/contentTree";
import { cn } from "@/lib/utils";

export interface ContentSidebarProps {
  categories: CategoryTree[];
  pageType: string;
  pageName: string;
  routeBase: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onOpenSearch: () => void;
  onRefresh: () => void;
  onNavigate?: () => void;
}

const RAIL_TONES = ["border-primary/60", "border-primary/40", "border-primary/25"];

const COLUMN_HEADER =
  "shrink-0 border-b border-border px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase";

type CategoryDialogState =
  | { mode: "create"; parentId: string | null }
  | { mode: "edit"; category: CategoryTree }
  | null;

export function ContentSidebar({
  categories,
  pageType,
  pageName,
  routeBase,
  canCreate,
  canEdit,
  canDelete,
  selectedCategoryId,
  onSelectCategory,
  onOpenSearch,
  onRefresh,
  onNavigate,
}: ContentSidebarProps) {
  const [categoryDialog, setCategoryDialog] = useState<CategoryDialogState>(null);
  const [newEntryFor, setNewEntryFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const flat = useMemo(() => flattenCategories(categories), [categories]);
  const selected = flat.find(({ cat }) => cat.id === selectedCategoryId) ?? flat[0];

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      onRefresh();
    } finally {
      setBusy(false);
    }
  }

  function handleDelete(category: CategoryTree) {
    if (!confirm(`Delete category "${category.label}" and all its contents? This cannot be undone.`)) return;
    void run(() => deleteCategory(pageType, category.id));
  }

  function copyEntryLink(slug: string) {
    void navigator.clipboard.writeText(`${window.location.origin}${routeBase}/${slug}`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-3">
        <Link
          to={routeBase}
          onClick={onNavigate}
          className="truncate text-sm font-semibold text-foreground hover:text-primary"
        >
          {pageName}
        </Link>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={onOpenSearch}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Search entries (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
          </button>
          {canCreate && (
            <button
              onClick={() => setCategoryDialog({ mode: "create", parentId: null })}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="New category"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 w-36 shrink-0 flex-col border-r border-border bg-muted/30">
          <div className={COLUMN_HEADER}>Folders</div>
          <div className="flex-1 overflow-y-auto px-1.5 py-2">
          {flat.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground/60">No categories.</p>
          ) : (
            flat.map(({ cat, depth, siblings, siblingIndex }) => (
              <CategoryRowMenu
                key={cat.id}
                canEdit={canEdit}
                canDelete={canDelete}
                canMoveUp={siblingIndex > 0}
                canMoveDown={siblingIndex < siblings.length - 1}
                onRename={() => setCategoryDialog({ mode: "edit", category: cat })}
                onNewEntry={() => setNewEntryFor(cat.id)}
                onNewSubcategory={() => setCategoryDialog({ mode: "create", parentId: cat.id })}
                onMoveUp={() => run(() => moveCategory(siblings, siblingIndex, siblingIndex - 1, pageType))}
                onMoveDown={() => run(() => moveCategory(siblings, siblingIndex, siblingIndex + 1, pageType))}
                onDelete={() => handleDelete(cat)}
              >
                <button
                  onClick={() => onSelectCategory(cat.id)}
                  disabled={busy}
                  className={cn(
                    "flex w-full items-stretch rounded-sm pr-1.5 pl-1 text-left text-xs leading-snug",
                    cat.id === selected?.cat.id
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {Array.from({ length: depth }, (_, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className={cn(
                        "mr-1.5 w-1.5 shrink-0 border-l",
                        cat.id === selected?.cat.id
                          ? "border-primary"
                          : RAIL_TONES[Math.min(i, RAIL_TONES.length - 1)],
                      )}
                    />
                  ))}
                  <span className="truncate py-2">{cat.label}</span>
                </button>
              </CategoryRowMenu>
            ))
          )}
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className={cn(COLUMN_HEADER, "flex items-center gap-2 text-primary")}>
            <span className="truncate">{selected?.cat.label ?? "Entries"}</span>
            {selected && (
              <span className="ml-auto shrink-0 tracking-normal text-muted-foreground/75">
                {selected.cat.entries.length}
                {selected.cat.entries.length === 1 ? " entry" : " entries"}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-1.5 py-2">
          {!selected ? null : selected.cat.entries.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground/60">No entries here yet.</p>
          ) : (
            selected.cat.entries.map((entry, idx) => (
              <EntryRowMenu
                key={entry.id}
                canEdit={canEdit}
                canMoveUp={idx > 0}
                canMoveDown={idx < selected.cat.entries.length - 1}
                onMoveUp={() => run(() => moveEntry(selected.cat.entries, idx, idx - 1, pageType))}
                onMoveDown={() => run(() => moveEntry(selected.cat.entries, idx, idx + 1, pageType))}
                onCopyLink={() => copyEntryLink(entry.slug)}
              >
                <Link
                  // @ts-expect-error -- routeBase is dynamic, TanStack Router cannot validate statically
                  to={`${routeBase}/$slug`}
                  params={{ slug: entry.slug }}
                  onClick={onNavigate}
                  className="block rounded-sm px-2.5 py-2 text-[13px] leading-snug text-muted-foreground hover:bg-muted/50 hover:text-foreground [&.active]:bg-primary/10 [&.active]:font-medium [&.active]:text-primary"
                >
                  {entry.title}
                </Link>
              </EntryRowMenu>
            ))
          )}
          {canEdit && selected && (
            <button
              onClick={() => setNewEntryFor(selected.cat.id)}
              className="mt-1 flex w-full items-center gap-1.5 rounded-sm px-2.5 py-2 text-[13px] text-muted-foreground/50 hover:text-muted-foreground"
            >
              <Plus className="h-3 w-3" />
              New entry
            </button>
          )}
          </div>
        </div>
      </div>

      <CategoryDialog
        open={categoryDialog !== null}
        onClose={() => setCategoryDialog(null)}
        pageType={pageType}
        allCategories={categories}
        editing={categoryDialog?.mode === "edit" ? categoryDialog.category : null}
        defaultParentId={categoryDialog?.mode === "create" ? categoryDialog.parentId : null}
        onSuccess={onRefresh}
      />
      {newEntryFor && (
        <NewEntryDialog
          open
          onClose={() => setNewEntryFor(null)}
          pageType={pageType}
          categoryId={newEntryFor}
          routeBase={routeBase}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
