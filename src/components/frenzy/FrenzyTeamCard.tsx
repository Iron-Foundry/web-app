import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import type { FrenzyTeamSummary } from "@/types/frenzy";

const RANK_COLORS = ["text-yellow-500", "text-slate-400", "text-amber-700"];

interface Props {
  team: FrenzyTeamSummary;
  rank: number;
}

export function FrenzyTeamCard({ team, rank }: Props) {
  const rankColor = RANK_COLORS[rank - 1] ?? "text-muted-foreground";

  return (
    <Link to="/activities/frenzy/$teamSlug" params={{ teamSlug: team.slug }}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4">
          <span className={`text-2xl font-bold w-8 text-center shrink-0 ${rankColor}`}>
            #{rank}
          </span>
          {team.icon_url ? (
            <img
              src={team.icon_url}
              alt={team.name}
              className="h-10 w-10 rounded object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.removeAttribute("style");
              }}
            />
          ) : null}
          <div className="h-10 w-10 rounded bg-muted shrink-0" style={team.icon_url ? { display: "none" } : undefined} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{team.name}</p>
            <div className="grid grid-cols-4 gap-1 mt-1.5">
              {Object.entries(team.tier_points).map(([tier, pts]) => (
                <div key={tier} className="rounded border bg-muted/50 flex flex-col items-center justify-center py-1 px-1">
                  <p className="text-[9px] text-muted-foreground leading-none">{tier}</p>
                  <p className="text-[11px] font-semibold leading-tight">{Math.floor(pts).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1.5 justify-end">
              <p className="text-xl font-bold">{Math.floor(team.total_points).toLocaleString()}</p>
              {team.pending_points > 0 && (
                <span className="text-sm text-muted-foreground/60 font-medium">
                  +{Math.floor(team.pending_points).toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {team.pending_points > 0 ? "pts + pending" : "points"}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
