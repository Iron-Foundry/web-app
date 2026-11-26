import { Link } from "@tanstack/react-router";
import { BookOpen, Search } from "lucide-react";
import { useContentContext } from "./ContentLayout";
import { ContentCategoryCard } from "./ContentCategoryCard";
import { ContentTableSkeleton } from "@/components/skeletons/ContentTableSkeleton";
import { PageHead } from "@/components/layout/PageHead";
import { countEntries, recentlyUpdated, shortAge } from "@/lib/contentTree";

interface ContentIndexPageProps {
  description: string;
}

export function ContentIndexPage({ description }: ContentIndexPageProps) {
  const { categories, isLoading, pageName, routeBase, openSearch } = useContentContext();

  if (isLoading) return <ContentTableSkeleton />;

  const totalEntries = countEntries(categories);
  const recent = recentlyUpdated(categories, 4);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      <PageHead title={pageName} lede={description}>
        {totalEntries > 0 && (
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={openSearch}
              className="flex w-full max-w-md items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Search className="h-4 w-4 shrink-0" />
              Search {totalEntries} {totalEntries === 1 ? "guide" : "guides"}...
              <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 font-mono text-xs">Ctrl K</kbd>
            </button>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4 shrink-0" />
              {totalEntries} {totalEntries === 1 ? "entry" : "entries"} across {categories.length} {categories.length === 1 ? "category" : "categories"}
            </p>
          </div>
        )}
      </PageHead>

      {recent.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-rs-bold text-3xl text-foreground">Recently updated</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map(({ entry, trail }) => (
              <Link
                key={entry.id}
                // @ts-expect-error -- routeBase is dynamic, TanStack Router cannot validate statically
                to={`${routeBase}/$slug`}
                params={{ slug: entry.slug }}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                <p className="truncate font-semibold leading-snug">{entry.title}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{trail.join(" / ")} - {shortAge(entry.updated_at)} ago</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {categories.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">No content yet.</p>
      ) : (
        <section className="space-y-4">
          <h2 className="font-rs-bold text-3xl text-foreground">Browse by category</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => <ContentCategoryCard key={cat.id} cat={cat} routeBase={routeBase} />)}
          </div>
        </section>
      )}
    </div>
  );
}
