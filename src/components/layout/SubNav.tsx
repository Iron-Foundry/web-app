import { Link, useLocation } from "@tanstack/react-router";
import { NAV_SECTIONS, getSectionForPath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function SubNav() {
  const { pathname } = useLocation();
  const activeTab = getSectionForPath(pathname);
  const section = NAV_SECTIONS.find((s) => s.tab === activeTab);

  if (!section) return null;

  return (
    <nav className="border-b border-border bg-card/60">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-1 px-4">
        {section.links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium text-muted-foreground",
              "transition-colors hover:bg-muted hover:text-foreground",
              "[&.active]:bg-muted [&.active]:text-primary",
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
