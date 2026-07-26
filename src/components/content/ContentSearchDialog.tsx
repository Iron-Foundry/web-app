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
    >
      <CommandInput placeholder={`Search ${pageName.toLowerCase()}...`} />
      <CommandList>
        <CommandEmpty>No entries found.</CommandEmpty>
        {entries.map(({ entry, trail }) => (
          <CommandItem
            key={entry.id}
            value={`${trail.join(" ")} ${entry.title}`}
            onSelect={() => {
              onOpenChange(false);
              navigate({ to: `${routeBase}/$slug`, params: { slug: entry.slug } });
            }}
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{entry.title}</span>
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
