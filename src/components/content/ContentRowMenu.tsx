import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, FolderPlus, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface CategoryRowMenuProps {
  children: ReactNode;
  canEdit: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRename: () => void;
  onNewEntry: () => void;
  onNewSubcategory: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export function CategoryRowMenu({
  children,
  canEdit,
  canDelete,
  canMoveUp,
  canMoveDown,
  onRename,
  onNewEntry,
  onNewSubcategory,
  onMoveUp,
  onMoveDown,
  onDelete,
}: CategoryRowMenuProps): ReactNode {
  if (!canEdit && !canDelete) return children;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {canEdit && (
          <>
            <ContextMenuItem onSelect={onRename}>
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onSelect={onNewEntry}>
              <Plus className="h-3.5 w-3.5" />
              New entry
            </ContextMenuItem>
            <ContextMenuItem onSelect={onNewSubcategory}>
              <FolderPlus className="h-3.5 w-3.5" />
              New sub-category
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={onMoveUp} disabled={!canMoveUp}>
              <ArrowUp className="h-3.5 w-3.5" />
              Move up
            </ContextMenuItem>
            <ContextMenuItem onSelect={onMoveDown} disabled={!canMoveDown}>
              <ArrowDown className="h-3.5 w-3.5" />
              Move down
            </ContextMenuItem>
          </>
        )}
        {canDelete && (
          <>
            {canEdit && <ContextMenuSeparator />}
            <ContextMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface EntryRowMenuProps {
  children: ReactNode;
  canEdit: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCopyLink: () => void;
}

export function EntryRowMenu({
  children,
  canEdit,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onCopyLink,
}: EntryRowMenuProps): ReactNode {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        {canEdit && (
          <>
            <ContextMenuItem onSelect={onMoveUp} disabled={!canMoveUp}>
              <ArrowUp className="h-3.5 w-3.5" />
              Move up
            </ContextMenuItem>
            <ContextMenuItem onSelect={onMoveDown} disabled={!canMoveDown}>
              <ArrowDown className="h-3.5 w-3.5" />
              Move down
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onSelect={onCopyLink}>
          <Link2 className="h-3.5 w-3.5" />
          Copy link
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
