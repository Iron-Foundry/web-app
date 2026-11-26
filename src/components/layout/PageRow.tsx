import { Link, useLocation } from "@tanstack/react-router";
import { getSectionForPath, rowSectionFor } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const ROW_LINK = cn(
  "shrink-0 whitespace-nowrap border-b-2 border-transparent py-3 text-sm text-muted-foreground",
  "transition-colors hover:text-foreground motion-reduce:transition-none",
  "[&.active]:border-primary [&.active]:text-foreground",
);

/** The pages of the current section, in a row under the top bar. The members rail replaces it from md up. */
export function PageRow(): React.ReactElement | null {
  const { pathname } = useLocation();
  const tab = getSectionForPath(pathname);
  const section = rowSectionFor(tab);
  if (!section) return null;

  return (
    <nav
      aria-label={`${section.label} pages`}
      className={cn("border-b border-border", tab === "members" && "md:hidden")}
    >
      <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-4 md:px-8">
        {section.links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            activeOptions={{ exact: "exact" in link && !!link.exact }}
            className={ROW_LINK}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
