import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { flattenEntries, type CategoryTree } from "@/lib/contentTree";

interface ContentSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryTree[];
  routeBase: string;
  pageName: string;
}

export function ContentSearchDialog({
  open,
  onOpenChange,
  categories,
  routeBase,
  pageName,
}: ContentSearchDialogProps) {
  const navigate = useNavigate();
  const entries = useMemo(() => flattenEntries(categories), [categories]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Search ${pageName}`}
      description="Search every entry by title or category."
      className="top-[12vh] translate-y-0 bg-background [&_[data-slot=command]]:bg-background"
    >
      <CommandInput placeholder={`Search ${pageName.toLowerCase()}...`} />
      <CommandList>
        <CommandEmpty>No entries found.</CommandEmpty>
        {entries.map(({ entry, trail }) => (
          <CommandItem
            key={entry.id}
            className="gap-3 rounded-md px-2.5 py-2 data-[selected=true]:bg-muted/40 data-[selected=true]:text-foreground [&[data-selected=true]_.cmd-title]:text-primary [&[data-selected=true]_svg]:text-primary"
            value={`${trail.join(" ")} ${entry.title}`}
            onSelect={() => {
              onOpenChange(false);
              navigate({ to: `${routeBase}/$slug`, params: { slug: entry.slug } });
            }}
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex min-w-0 flex-col">
              <span className="cmd-title truncate transition-colors">{entry.title}</span>
              <span className="truncate text-xs text-muted-foreground">
                {trail.join(" / ")}
              </span>
            </span>
          </CommandItem>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
