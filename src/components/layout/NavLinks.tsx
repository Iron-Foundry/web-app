import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface NavLink {
  to: string;
  label: string;
}

interface NavLinksProps {
  links: readonly NavLink[];
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}

export function NavLinks({ links, orientation = "horizontal", onNavigate }: NavLinksProps) {
  return (
    <nav
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row items-center",
      )}
    >
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          activeOptions={{ exact: link.to === "/" }}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
            "transition-colors hover:bg-muted hover:text-foreground",
            "[&.active]:bg-muted [&.active]:text-primary",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
