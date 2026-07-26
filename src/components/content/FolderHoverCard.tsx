import type { ReactNode } from "react";
import { FileText, Folder } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { shortAge, type CategoryTree } from "@/lib/contentTree";

const PREVIEW_LIMIT = 5;

interface FolderHoverCardProps {
  cat: CategoryTree;
  children: ReactNode;
}

export function FolderHoverCard({ cat, children }: FolderHoverCardProps) {
  const shown = cat.entries.slice(0, PREVIEW_LIMIT);
  const hidden = cat.entries.length - shown.length;

  return (
    <HoverCard openDelay={400} closeDelay={150}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={10}
        className="w-64 p-3.5 max-md:hidden"
      >
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-rs-bold truncate text-sm text-primary">{cat.label}</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {cat.entries.length} {cat.entries.length === 1 ? "entry" : "entries"}
          {cat.children.length > 0 &&
            ` - ${cat.children.length} sub-folder${cat.children.length === 1 ? "" : "s"}`}
        </p>

        <div className="mt-2.5 flex flex-col gap-0.5">
          {shown.length === 0 ? (
            <p className="text-xs italic text-muted-foreground/50">No entries yet.</p>
          ) : (
            shown.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3 shrink-0 opacity-70" />
                <span className="truncate">{entry.title}</span>
                {entry.updated_at && (
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/60">
                    {shortAge(entry.updated_at)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {hidden > 0 && (
          <p className="mt-2.5 border-t border-border pt-2.5 text-[11px] text-muted-foreground/70">
            + {hidden} more inside
          </p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
