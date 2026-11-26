import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { rankEmoji, fmtCompetitionLabel, VARIANT_LABELS } from "@/lib/competitions";
import type { RaidPlayerRow, RaidTeamRow } from "@/lib/competitionRows";
import { useOwnRsns } from "@/hooks/useOwnRsns";
import { AccountHoverCard } from "@/components/accounts/accountHoverCard";
import { diffStyle, fmtDiff, rankGainStyle } from "./CompetitionTables";

/** The raid standings tables: players or teams, one column per raid variant. */

export function RaidClassicTable({ rows, variants }: { rows: RaidPlayerRow[]; variants: string[] }) {
  const ownRsns = useOwnRsns();
  const ownEntries = rows.filter((r) => ownRsns.has(r.player_name.toLowerCase()));
  const userBest = ownEntries.length > 0 ? ownEntries.reduce((best, cur) => cur.rank < best.rank ? cur : best) : null;
  const gridCols = `2.5rem 1fr ${variants.map(() => "6rem").join(" ")} 7rem${userBest ? " 5rem" : ""}`;
  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="gap-x-4 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border" style={{ display: "grid", gridTemplateColumns: gridCols }}>
          <span>Rank</span><span>Player</span>
          {variants.map((v) => <span key={v} className="text-right">{VARIANT_LABELS[v] ?? fmtCompetitionLabel(v)}</span>)}
          <span className="text-right">Total</span>
          {userBest && <span className="text-right">Diff</span>}
        </div>
        {rows.map((r) => {
          const diff = userBest ? r.total - userBest.total : 0;
          return (
          <div key={r.player_name} className="shine-row gap-x-4 px-3 py-2 items-center text-sm border-b border-border/50 last:border-0 hover:bg-muted/30" style={{ display: "grid", gridTemplateColumns: gridCols }}>
            <span className="font-medium text-muted-foreground">{rankEmoji(r.rank)}</span>
            <AccountHoverCard rsn={r.player_name} className={cn("truncate font-medium", ownRsns.has(r.player_name.toLowerCase()) && "own-rsn")}>{r.player_name}</AccountHoverCard>
            {variants.map((v) => <span key={v} className="text-right text-muted-foreground text-xs">{(r.variants[v] ?? 0).toLocaleString()}</span>)}
            <span className="text-right">
              <Badge variant="outline" className="font-mono text-xs" style={rankGainStyle(r.rank, r.total)}>+{r.total.toLocaleString()}</Badge>
            </span>
            {userBest && (
              <span className="text-right font-mono text-xs" style={diffStyle(diff)}>{fmtDiff(diff, "kc")}</span>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

export function RaidTeamTable({ teams, variants }: { teams: RaidTeamRow[]; variants: string[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const ownRsns = useOwnRsns();
  function toggle(name: string) {
    setExpanded((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  }
  const gridCols = `2.5rem 1fr 5rem ${variants.map(() => "6rem").join(" ")} 7rem`;
  const memberGridCols = `2.5rem 1fr ${variants.map(() => "6rem").join(" ")} 7rem`;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="gap-x-4 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border" style={{ display: "grid", gridTemplateColumns: gridCols }}>
          <span>Rank</span><span>Team</span><span className="text-right">Members</span>
          {variants.map((v) => <span key={v} className="text-right">{VARIANT_LABELS[v] ?? fmtCompetitionLabel(v)}</span>)}
          <span className="text-right">Total</span>
        </div>
        {teams.map((team) => {
          const open = expanded.has(team.team_name);
          return (
            <div key={team.team_name}>
              <button onClick={() => toggle(team.team_name)} className="shine-row w-full gap-x-4 px-3 py-2 items-center text-sm border-b border-border/50 hover:bg-muted/30 text-left" style={{ display: "grid", gridTemplateColumns: gridCols }}>
                <span className="font-medium text-muted-foreground">{rankEmoji(team.rank)}</span>
                <span className="flex items-center gap-1.5 font-semibold">
                  {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  {team.team_name}
                </span>
                <span className="text-right text-xs text-muted-foreground">{team.members.length}</span>
                {variants.map((v) => <span key={v} className="text-right text-muted-foreground text-xs">{(team.variants[v] ?? 0).toLocaleString()}</span>)}
                <span className="text-right">
                  <Badge variant="outline" className="font-mono text-xs" style={rankGainStyle(team.rank, team.total)}>+{team.total.toLocaleString()}</Badge>
                </span>
              </button>
              {open && (
                <div className="bg-muted/20 border-b border-border/50">
                  {team.members.map((m) => (
                    <div key={m.player_name} className="gap-x-4 pl-10 pr-3 py-1.5 items-center text-xs text-muted-foreground" style={{ display: "grid", gridTemplateColumns: memberGridCols }}>
                      <span /><AccountHoverCard rsn={m.player_name} className={cn(ownRsns.has(m.player_name.toLowerCase()) && "own-rsn")}>{m.player_name}</AccountHoverCard>
                      {variants.map((v) => <span key={v} className="text-right font-mono text-primary/70">{(m.variants[v] ?? 0).toLocaleString()}</span>)}
                      <span className="text-right font-mono font-semibold text-primary">+{m.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
