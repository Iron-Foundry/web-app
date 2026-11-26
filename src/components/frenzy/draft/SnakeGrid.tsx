import { ArrowRight, ChevronLeft } from "lucide-react";
import { gridRounds, memberAtPick, pickAt, roundOf } from "@/lib/frenzyDraft";
import { cn } from "@/lib/utils";
import type { DraftView } from "@/types/frenzyDraft";
import { ZoneOffset, type ViewerZone } from "./ZoneOffset";

const WINDOW = 6;

/** The rounds to draw: every top-pick round, or a window around the current round of a full draft. */
function visibleRounds(view: DraftView): number[] {
  const rounds = gridRounds(view);
  if (view.mode === "top_picks" || rounds <= WINDOW) return Array.from({ length: rounds }, (_, i) => i + 1);
  const now = view.state === "complete" ? rounds : roundOf(view.next_pick, view.teams.length);
  const first = Math.max(1, Math.min(now - 2, rounds - WINDOW + 1));
  return Array.from({ length: WINDOW }, (_, i) => first + i);
}

/** The snake draft as a table: one row per round, one column per captain in drawn order. */
export function SnakeGrid({ view, viewer }: { view: DraftView; viewer: ViewerZone }): React.ReactElement {
  const teams = view.teams.length;
  const rounds = gridRounds(view);
  const picking = view.state === "picking" ? view.next_pick : null;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-3 py-2" />
            {view.teams.map((team, i) => (
              <th key={team.team_id} className="px-3 py-2 font-semibold">
                <span className="block font-rs-bold text-base text-foreground">{team.captain.rsn}</span>
                {i + 1}
                <ZoneOffset zone={team.captain.timezone} viewer={viewer} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRounds(view).map((round) => {
            const Arrow = round % 2 === 1 ? ArrowRight : ChevronLeft;
            return (
              <tr key={round} className="border-t border-border">
                <th className="w-24 whitespace-nowrap px-3 py-2 text-left text-xs font-normal text-muted-foreground">
                  Round {round} <Arrow className="inline h-3.5 w-3.5" aria-hidden />
                </th>
                {view.teams.map((team, position) => {
                  const pick = pickAt(round, position, teams);
                  const made = memberAtPick(view, pick);
                  const now = pick === picking;
                  return (
                    <td
                      key={team.team_id}
                      className={cn("px-3 py-2", !made && "text-muted-foreground", now && "font-semibold text-primary ring-2 ring-inset ring-primary/60")}
                    >
                      {made ? made.rsn : now ? `${pick} · picking` : pick}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {view.mode === "top_picks" && (
            <tr className="border-t border-border">
              <th className="px-3 py-2 text-left text-xs font-normal text-muted-foreground">After round {rounds}</th>
              <td colSpan={teams} className="px-3 py-2 text-muted-foreground">
                The rest are handed out in snake order
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
