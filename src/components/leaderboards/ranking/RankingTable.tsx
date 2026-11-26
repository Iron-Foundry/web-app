import { cn } from "@/lib/utils";
import { AccountHoverCard } from "@/components/accounts/accountHoverCard";
import { WOM_RANK_COLOR, GEM_RANK_COLOR } from "@/lib/leaderboardRanks";
import { fmtNum } from "@/components/leaderboards/RankRow";
import type { RankingPlayer } from "@/types/leaderboard";

interface Props {
  players: RankingPlayer[];
  offset: number;
  compact: boolean;
  ownRsns: Set<string>;
  onSelect: (player: RankingPlayer) => void;
}

/** The ranking table: position, RSN, clan and WOM rank, points, and in comfortable density the PvM and skill split. */
export function RankingTable({ players: visiblePlayers, offset, compact, ownRsns, onSelect }: Props): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">#</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">RSN</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Clan rank</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">WOM rank</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Points</th>
            {!compact && (
              <>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">PvM pts</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Skill pts</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {visiblePlayers.map((p, i) => {
            const totalPts = p.boss_points + p.skill_points;
            const bossPct = totalPts > 0 ? Math.round((p.boss_points / totalPts) * 100) : 0;
            return (
              <tr
                key={p.rsn}
                className="hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onSelect(p)}
              >
                <td className={cn("px-3 py-2 text-muted-foreground tabular-nums", compact && "py-1")}>
                  {offset + i + 1}
                </td>
                <td className={cn("px-3 py-2 font-mono font-medium", compact && "py-1 text-xs")}>
                  <AccountHoverCard rsn={p.rsn} className={cn(ownRsns.has(p.rsn.toLowerCase()) && "own-rsn")}>{p.rsn}</AccountHoverCard>
                </td>
                <td className={cn("px-3 py-2", compact && "py-1", GEM_RANK_COLOR[p.clan_rank ?? ""] ?? "text-muted-foreground")}>
                  <span className="text-xs">{p.clan_rank ?? "-"}</span>
                </td>
                <td className={cn("px-3 py-2", compact && "py-1", WOM_RANK_COLOR[p.rank] ?? "text-muted-foreground")}>
                  <span className="text-xs">{p.rank}</span>
                </td>
                <td className={cn("px-3 py-2 text-right tabular-nums", compact && "py-1 text-xs")}>{fmtNum(p.points)}</td>
                {!compact && (
                  <>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground text-xs">
                      {fmtNum(p.boss_points)}<span className="ml-1 text-muted-foreground/60">({bossPct}%)</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground text-xs">
                      {fmtNum(p.skill_points)}<span className="ml-1 text-muted-foreground/60">({100 - bossPct}%)</span>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {visiblePlayers.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">No players match this filter.</p>
      )}
    </div>
  );
}
