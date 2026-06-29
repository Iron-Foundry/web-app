import { cn } from "@/lib/utils";
import { GEM_RANKS, GEM_RANK_COLOR } from "@/lib/leaderboardRanks";

export function RankFilterPills({
  active,
  onChange,
  compact,
  counts,
}: {
  active: string | null;
  onChange: (r: string | null) => void;
  compact: boolean;
  counts?: Record<string, number>;
}): React.ReactElement {
  const total = counts ? Object.values(counts).reduce((s, n) => s + n, 0) : null;
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "rounded-full px-3 py-0.5 font-medium transition-colors border",
          compact && "px-2 py-px text-xs",
          active === null
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
        )}
      >
        {total !== null ? `All (${total})` : "All"}
      </button>
      {GEM_RANKS.map((r) => {
        const count = counts?.[r];
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={cn(
              "rounded-full px-3 py-0.5 font-medium transition-colors border text-sm",
              compact && "px-2 py-px text-xs",
              active === r
                ? "border-primary bg-primary text-primary-foreground"
                : cn("border-border hover:border-primary", GEM_RANK_COLOR[r]),
            )}
          >
            {count !== undefined ? `${r} (${count})` : r}
          </button>
        );
      })}
    </div>
  );
}
