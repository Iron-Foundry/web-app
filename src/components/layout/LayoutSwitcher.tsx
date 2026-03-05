import { useLayout, type NavLayout } from "@/context/LayoutContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS: { label: string; value: NavLayout }[] = [
  { label: "Top", value: "top" },
  { label: "Sidebar", value: "sidebar" },
  { label: "Hybrid", value: "hybrid" },
];

export function LayoutSwitcher() {
  const { navLayout, setNavLayout } = useLayout();

  return (
    <div className="flex items-center gap-1">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant="ghost"
          size="sm"
          onClick={() => setNavLayout(opt.value)}
          className={cn(
            "h-7 px-2 text-xs text-muted-foreground",
            navLayout === opt.value && "bg-muted text-primary"
          )}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}