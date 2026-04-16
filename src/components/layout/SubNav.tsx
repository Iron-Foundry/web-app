import { Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const SUBNAV_LINKS = [
  { to: "/leaderboards", label: "Personal Bests" },
] as const;

export function SubNav() {
  const { user, loading } = useAuth();
  if (loading || !user) return null;

  return (
    <nav className="border-b border-border bg-card/60">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-1 px-4">
        {SUBNAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: false }}
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
