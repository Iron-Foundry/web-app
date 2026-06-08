import { Link, useLocation } from "@tanstack/react-router";
import { STAFF_SECTION, getSectionForPath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function SubNav() {
  const { pathname } = useLocation();
  const activeTab = getSectionForPath(pathname);

  if (activeTab !== "staff") return null;

  const section = STAFF_SECTION;

  return (
    <nav className="border-b border-border bg-card/60">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-1 px-4">
        {section.links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            activeOptions={{ exact: "exact" in link && !!link.exact }}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium text-muted-foreground",
              "transition-colors hover:bg-muted hover:text-foreground",
              "[&.active]:bg-muted [&.active]:text-primary",
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
