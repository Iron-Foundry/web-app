import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useContentContext, type CategoryTree, type ContentEntry } from "./ContentLayout";

function countEntries(cats: CategoryTree[]): number {
  return cats.reduce((n, c) => n + c.entries.length + countEntries(c.children), 0);
}

function EntryLink({ entry, routeBase }: { entry: ContentEntry; routeBase: string }) {
  return (
    <Link
      // @ts-expect-error -- routeBase is dynamic, TanStack Router cannot validate statically
      to={`${routeBase}/$slug`}
      params={{ slug: entry.slug }}
      className="block text-sm text-muted-foreground hover:text-primary py-0.5 leading-snug transition-colors truncate"
    >
      {entry.title}
    </Link>
  );
}

function CategoryCard({ cat, routeBase }: { cat: CategoryTree; routeBase: string }) {
  const directCount = cat.entries.length;
  const childCount = cat.children.reduce((n, c) => n + c.entries.length, 0);
  const total = directCount + childCount;

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-rs-bold text-primary text-base leading-tight">{cat.label}</h2>
        {total > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 tabular-nums">
            {total}
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-xs text-muted-foreground/50 italic">No entries yet.</p>
      ) : (
        <div className="space-y-2">
          {cat.entries.map((e) => (
            <EntryLink key={e.id} entry={e} routeBase={routeBase} />
          ))}
          {cat.children.map((child) =>
            child.entries.length === 0 ? null : (
              <div key={child.id} className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-1">
                  {child.label}
                </p>
                {child.entries.map((e) => (
                  <EntryLink key={e.id} entry={e} routeBase={routeBase} />
                ))}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

interface ContentIndexPageProps {
  description: string;
}

export function ContentIndexPage({ description }: ContentIndexPageProps) {
  const { categories, pageName, routeBase } = useContentContext();

  const totalEntries = countEntries(categories);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="space-y-2 pb-4 border-b border-border">
        <h1 className="font-rs-bold text-4xl text-primary">{pageName}</h1>
        <p className="text-muted-foreground">{description}</p>
        {totalEntries > 0 && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground/70 pt-1">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            {totalEntries} {totalEntries === 1 ? "entry" : "entries"} across {categories.length}{" "}
            {categories.length === 1 ? "category" : "categories"}
          </p>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No content yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} routeBase={routeBase} />
          ))}
        </div>
      )}
    </div>
  );
}
