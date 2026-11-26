import { GEM_RANK_COLOR } from "@/lib/leaderboardRanks";
import { cn } from "@/lib/utils";

/** A member's clan rank in its gem colour, or a dash when the member has no ranking. */
export function RankText({ rank }: { rank: string | null }): React.ReactElement {
  return <span className={cn("truncate text-xs", rank ? (GEM_RANK_COLOR[rank] ?? "text-muted-foreground") : "text-muted-foreground/40")}>{rank ?? "-"}</span>;
}
