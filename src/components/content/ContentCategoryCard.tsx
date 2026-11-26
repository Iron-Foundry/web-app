import { Link } from "@tanstack/react-router";
import { FileText, Folder } from "lucide-react";
import { shortAge, type CategoryTree, type ContentEntry } from "@/lib/contentTree";

const ENTRIES_PER_CARD = 5;

interface CardEntry {
  entry: ContentEntry;
  subLabel: string | null;
}

function cardEntries(cat: CategoryTree): CardEntry[] {
  return [
    ...cat.entries.map((entry) => ({ entry, subLabel: null })),
    ...cat.children.flatMap((child) => child.entries.map((entry) => ({ entry, subLabel: child.label }))),
  ];
}

function EntryLink({ entry, routeBase }: { entry: ContentEntry; routeBase: string }): React.ReactElement {
  return (
    <Link
      // @ts-expect-error -- routeBase is dynamic, TanStack Router cannot validate statically
      to={`${routeBase}/$slug`}
      params={{ slug: entry.slug }}
      className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-mk-body transition-colors hover:bg-muted hover:text-foreground"
    >
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{entry.title}</span>
      {entry.updated_at && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{shortAge(entry.updated_at)}</span>}
    </Link>
  );
}

/** One category: its title and count, its sub-folder count, its first five entries and how many more. */
export function ContentCategoryCard({ cat, routeBase }: { cat: CategoryTree; routeBase: string }): React.ReactElement {
  const all = cardEntries(cat);
  const shown = all.slice(0, ENTRIES_PER_CARD);
  const hidden = all.length - shown.length;

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-5">
      <header className="flex items-center gap-2">
        <Folder className="h-4 w-4 shrink-0 text-primary" />
        <h3 className="flex-1 truncate font-rs-bold text-lg leading-tight">{cat.label}</h3>
        {all.length > 0 && <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{all.length}</span>}
      </header>
      {cat.children.length > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">{cat.children.length} sub-folder{cat.children.length === 1 ? "" : "s"}</p>
      )}
      <div className="mt-3 flex flex-col">
        {shown.length === 0 && <p className="text-sm italic text-muted-foreground">No entries yet.</p>}
        {shown.map(({ entry, subLabel }, i) => (
          <div key={entry.id}>
            {subLabel && subLabel !== shown[i - 1]?.subLabel && (
              <p className="mt-2 mb-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{subLabel}</p>
            )}
            <EntryLink entry={entry} routeBase={routeBase} />
          </div>
        ))}
      </div>
      {hidden > 0 && <p className="mt-2 text-sm text-muted-foreground">+ {hidden} more</p>}
    </article>
  );
}
