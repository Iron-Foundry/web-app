import { Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FrenzyTierBar, FrenzyTierLegend } from "./FrenzyTierBar";
import type { FrenzyTeamSummary } from "@/types/frenzy";

const PLACE_COLORS = ["text-yellow-500", "text-slate-400", "text-amber-700"];
const NUM = "text-right tabular-nums";
const WIDE = "hidden md:table-cell";

function points(value: number): string {
  return Math.floor(value).toLocaleString();
}

export function TeamIcon({ team, className }: { team: { name: string; icon_url: string | null }; className: string }): React.ReactElement {
  return team.icon_url ? (
    <img src={team.icon_url} alt={`${team.name} team icon`} className={`${className} rounded object-contain shrink-0`} />
  ) : (
    <div role="img" aria-label={`${team.name} has no icon`} className={`${className} rounded bg-muted shrink-0`} />
  );
}

function StandingsRow({ team, place, tiers }: { team: FrenzyTeamSummary; place: number; tiers: string[] }): React.ReactElement {
  return (
    <TableRow>
      <TableCell className={`font-rs-bold text-xl ${PLACE_COLORS[place - 1] ?? "text-muted-foreground"}`}>#{place}</TableCell>
      <TableCell className="min-w-40">
        <Link to="/activities/frenzy/$teamSlug" params={{ teamSlug: team.slug }} className="flex items-center gap-2.5 hover:text-primary">
          <TeamIcon team={team} className="h-7 w-7" />
          <span className="font-medium truncate">{team.name}</span>
        </Link>
        <FrenzyTierBar tierPoints={team.tier_points} className="h-1.5 mt-2" />
      </TableCell>
      {tiers.map((tier) => (
        <TableCell key={tier} className={`${NUM} ${WIDE}`}>{points(team.tier_points[tier] ?? 0)}</TableCell>
      ))}
      <TableCell className={`${NUM} ${WIDE}`}>{points(team.activity_points)}</TableCell>
      <TableCell className={`${NUM} ${WIDE}`}>{points(team.milestone_points)}</TableCell>
      <TableCell className={NUM}>
        <span className="font-bold text-base">{points(team.total_points)}</span>
        {team.pending_points > 0 && <span className="block text-xs text-sky-500">+{points(team.pending_points)} pending</span>}
      </TableCell>
    </TableRow>
  );
}

export function FrenzyStandings({ teams }: { teams: FrenzyTeamSummary[] }): React.ReactElement {
  const ranked = [...teams].sort((a, b) => b.total_points - a.total_points);
  const tiers = Array.from(new Set(teams.flatMap((t) => Object.keys(t.tier_points))));
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-rs-bold text-2xl text-primary">Standings</h2>
        <FrenzyTierLegend tiers={tiers} />
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Team</TableHead>
              {tiers.map((tier) => (
                <TableHead key={tier} className={`${NUM} ${WIDE}`}>{tier}</TableHead>
              ))}
              <TableHead className={`${NUM} ${WIDE}`}>Activities</TableHead>
              <TableHead className={`${NUM} ${WIDE}`}>Milestones</TableHead>
              <TableHead className={NUM}>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((team, i) => (
              <StandingsRow key={team.id} team={team} place={i + 1} tiers={tiers} />
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
