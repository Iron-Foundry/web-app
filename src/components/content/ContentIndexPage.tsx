import { Link } from "@tanstack/react-router";
import { BookOpen, FileText, Folder, Search } from "lucide-react";
import { useContentContext } from "./ContentLayout";
import { ContentTableSkeleton } from "@/components/skeletons/ContentTableSkeleton";
import { Separator } from "@/components/ui/separator";
import {
  countEntries,
  recentlyUpdated,
  shortAge,
  type CategoryTree,
  type ContentEntry,
} from "@/lib/contentTree";

const ENTRIES_PER_CARD = 5;

interface CardEntry {
  entry: ContentEntry;
  subLabel: string | null;
}

function cardEntries(cat: CategoryTree): CardEntry[] {
  return [
    ...cat.entries.map((entry) => ({ entry, subLabel: null })),
    ...cat.children.flatMap((child) =>
      child.entries.map((entry) => ({ entry, subLabel: child.label })),
    ),
  ];
}

function EntryLink({ entry, routeBase }: { entry: ContentEntry; routeBase: string }) {
  return (
    <Link
      // @ts-expect-error -- routeBase is dynamic, TanStack Router cannot validate statically
      to={`${routeBase}/$slug`}
      params={{ slug: entry.slug }}
      className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary"
    >
      <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span className="truncate">{entry.title}</span>
      {entry.updated_at && (
        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground/60">
          {shortAge(entry.updated_at)}
        </span>
      )}
    </Link>
  );
}

function CategoryCard({ cat, routeBase }: { cat: CategoryTree; routeBase: string }) {
  const all = cardEntries(cat);
  const shown = all.slice(0, ENTRIES_PER_CARD);
  const hidden = all.length - shown.length;
  let lastSub: string | null = null;

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Folder className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="font-rs-bold flex-1 truncate text-base leading-tight text-primary">
          {cat.label}
        </h2>
        {all.length > 0 && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
            {all.length}
          </span>
        )}
      </div>
      {cat.children.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground/80">
          {cat.children.length} sub-folder{cat.children.length === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-3 flex flex-col">
        {shown.length === 0 ? (
          <p className="text-xs italic text-muted-foreground/50">No entries yet.</p>
        ) : (
          shown.map(({ entry, subLabel }) => {
            const heading = subLabel && subLabel !== lastSub ? subLabel : null;
            lastSub = subLabel;
            return (
              <div key={entry.id}>
                {heading && (
                  <p className="mt-2 mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {heading}
                  </p>
                )}
                <EntryLink entry={entry} routeBase={routeBase} />
              </div>
            );
          })
        )}
      </div>

      {hidden > 0 && (
        <p className="mt-2 text-xs text-muted-foreground/70">+ {hidden} more</p>
      )}
    </div>
  );
}

interface ContentIndexPageProps {
  description: string;
}

export function ContentIndexPage({ description }: ContentIndexPageProps) {
  const { categories, isLoading, pageName, routeBase, openSearch } = useContentContext();

  if (isLoading) return <ContentTableSkeleton />;

  const totalEntries = countEntries(categories);
  const recent = recentlyUpdated(categories, 4);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 xl:max-w-6xl 2xl:max-w-[100rem]">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="font-rs-bold text-4xl text-primary">{pageName}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {totalEntries > 0 && (
          <>
            <button
              onClick={openSearch}
              className="flex w-full max-w-md items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Search className="h-4 w-4 shrink-0" />
              Search {totalEntries} {totalEntries === 1 ? "guide" : "guides"}...
              <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl K
              </kbd>
            </button>

            <p className="flex items-center gap-1.5 text-sm text-muted-foreground/70">
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              {totalEntries} {totalEntries === 1 ? "entry" : "entries"} across {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"}
            </p>
          </>
        )}
      </div>

      {recent.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Recently updated
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
              {recent.map(({ entry, trail }) => (
                <Link
                  key={entry.id}
                  // @ts-expect-error -- routeBase is dynamic, TanStack Router cannot validate statically
                  to={`${routeBase}/$slug`}
                  params={{ slug: entry.slug }}
                  className="rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/50"
                >
                  <p className="truncate text-sm font-semibold leading-snug">{entry.title}</p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {trail.join(" / ")}
                    <span className="text-primary/85"> - {shortAge(entry.updated_at)} ago</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {categories.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">No content yet.</p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Browse by category
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} routeBase={routeBase} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
