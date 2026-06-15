import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtGained, rankEmoji, fmtCompetitionLabel, VARIANT_LABELS } from "@/lib/competitions";
import type { RaidPlayerRow, RaidTeamRow } from "@/lib/competitions";
import type { TeamRow, MetricParticipation } from "@/types/competitions";
import { useOwnRsns } from "@/hooks/useOwnRsns";

export function rankGainStyle(rank: number, value: number): React.CSSProperties {
  if (rank === 1) return { color: "hsl(44 72% 52%)", borderColor: "hsl(44 72% 52% / 0.4)" };
  if (rank === 2) return { color: "hsl(210 20% 72%)", borderColor: "hsl(210 20% 72% / 0.4)" };
  if (rank === 3) return { color: "hsl(25 60% 55%)", borderColor: "hsl(25 60% 55% / 0.4)" };
  if (value > 0) return { color: "hsl(142 71% 45%)", borderColor: "hsl(142 71% 45% / 0.4)" };
  return {};
}

export function ClassicTable({ participations, metric }: { participations: MetricParticipation[]; metric: string }) {
  const ownRsns = useOwnRsns();
  return (
    <div>
      <div className="grid grid-cols-[1.5rem_1fr_4rem_4rem_5rem] sm:grid-cols-[2.5rem_1fr_7rem_7rem_7rem] gap-x-2 sm:gap-x-4 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">
        <span>Rank</span><span>Player</span>
        <span className="text-right">Start</span><span className="text-right">End</span><span className="text-right">Gained</span>
      </div>
      {participations.map((p) => (
        <div key={p.player_name} className="shine-row grid grid-cols-[1.5rem_1fr_4rem_4rem_5rem] sm:grid-cols-[2.5rem_1fr_7rem_7rem_7rem] gap-x-2 sm:gap-x-4 px-3 py-2 items-center text-sm border-b border-border/50 last:border-0 hover:bg-muted/30">
          <span className="font-medium text-muted-foreground">{rankEmoji(p.rank)}</span>
          <span className={cn("truncate font-medium", ownRsns.has(p.player_name.toLowerCase()) && "own-rsn")}>{p.player_name}</span>
          <span className="text-right text-muted-foreground text-xs">{fmtGained(p.start, metric)}</span>
          <span className="text-right text-muted-foreground text-xs">{fmtGained(p.end, metric)}</span>
          <span className="text-right">
            <Badge variant="outline" className="font-mono text-xs" style={rankGainStyle(p.rank, p.gained)}>+{fmtGained(p.gained, metric)}</Badge>
          </span>
        </div>
      ))}
    </div>
  );
}

export function TeamTable({ teams, metric }: { teams: TeamRow[]; metric: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const ownRsns = useOwnRsns();
  function toggle(name: string) {
    setExpanded((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  }
  return (
    <div>
      <div className="grid grid-cols-[2.5rem_1fr_5rem_7rem] gap-x-4 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">
        <span>Rank</span><span>Team</span><span className="text-right">Members</span><span className="text-right">Total Gained</span>
      </div>
      {teams.map((team) => {
        const open = expanded.has(team.team_name);
        return (
          <div key={team.team_name}>
            <button onClick={() => toggle(team.team_name)} className="shine-row w-full grid grid-cols-[2.5rem_1fr_5rem_7rem] gap-x-4 px-3 py-2 items-center text-sm border-b border-border/50 hover:bg-muted/30 text-left">
              <span className="font-medium text-muted-foreground">{rankEmoji(team.rank)}</span>
              <span className="flex items-center gap-1.5 font-semibold">
                {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                {team.team_name}
              </span>
              <span className="text-right text-xs text-muted-foreground">{team.members.length}</span>
              <span className="text-right">
                <Badge variant="outline" className="font-mono text-xs" style={rankGainStyle(team.rank, team.total_gained)}>+{fmtGained(team.total_gained, metric)}</Badge>
              </span>
            </button>
            {open && (
              <div className="bg-muted/20 border-b border-border/50">
                {team.members.map((m) => (
                  <div key={m.player_name} className="grid grid-cols-[2.5rem_1fr_auto] gap-x-4 pl-10 pr-3 py-1.5 items-center text-xs text-muted-foreground">
                    <span /><span className={cn(ownRsns.has(m.player_name.toLowerCase()) && "own-rsn")}>{m.player_name}</span>
                    <span className="text-right font-mono text-primary">+{fmtGained(m.gained, metric)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RaidClassicTable({ rows, variants }: { rows: RaidPlayerRow[]; variants: string[] }) {
  const ownRsns = useOwnRsns();
  const gridCols = `2.5rem 1fr ${variants.map(() => "6rem").join(" ")} 7rem`;
  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="gap-x-4 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border" style={{ display: "grid", gridTemplateColumns: gridCols }}>
          <span>Rank</span><span>Player</span>
          {variants.map((v) => <span key={v} className="text-right">{VARIANT_LABELS[v] ?? fmtCompetitionLabel(v)}</span>)}
          <span className="text-right">Total</span>
        </div>
        {rows.map((r) => (
          <div key={r.player_name} className="shine-row gap-x-4 px-3 py-2 items-center text-sm border-b border-border/50 last:border-0 hover:bg-muted/30" style={{ display: "grid", gridTemplateColumns: gridCols }}>
            <span className="font-medium text-muted-foreground">{rankEmoji(r.rank)}</span>
            <span className={cn("truncate font-medium", ownRsns.has(r.player_name.toLowerCase()) && "own-rsn")}>{r.player_name}</span>
            {variants.map((v) => <span key={v} className="text-right text-muted-foreground text-xs">{(r.variants[v] ?? 0).toLocaleString()}</span>)}
            <span className="text-right">
              <Badge variant="outline" className="font-mono text-xs" style={rankGainStyle(r.rank, r.total)}>+{r.total.toLocaleString()}</Badge>
            </span>
          </div>
        ))}
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
                      <span /><span className={cn(ownRsns.has(m.player_name.toLowerCase()) && "own-rsn")}>{m.player_name}</span>
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
