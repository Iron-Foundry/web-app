import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { shineHandlers } from "@/hooks/useShineEffect";
import type { FrenzyTeamSummary } from "@/types/frenzy";

const RANK_LABEL_COLORS = ["text-yellow-500", "text-slate-400", "text-amber-700"];
const RANK_BORDER_COLORS = ["border-yellow-500/40", "border-slate-400/40", "border-amber-700/40"];
const RANK_BG_COLORS = ["bg-yellow-500/5", "bg-slate-400/5", "bg-amber-700/5"];
const TIER_BAR_COLORS = [
  "bg-yellow-500",
  "bg-sky-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-rose-500",
];

type Variant = "hero" | "standard" | "compact";

interface Props {
  team: FrenzyTeamSummary;
  rank: number;
  variant?: Variant;
}

function TierBar({ tierPoints, totalPoints }: { tierPoints: Record<string, number>; totalPoints: number }) {
  if (totalPoints === 0) return <div className="h-1.5 w-full rounded-full bg-muted" />;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full gap-px">
      {Object.entries(tierPoints).map(([tier, pts], i) => {
        const pct = (pts / totalPoints) * 100;
        if (pct === 0) return null;
        return (
          <div
            key={tier}
            className={TIER_BAR_COLORS[i % TIER_BAR_COLORS.length]}
            style={{ width: `${pct}%` }}
            title={`${tier}: ${Math.floor(pts).toLocaleString()} pts`}
          />
        );
      })}
    </div>
  );
}

function TeamIcon({ url, name, size }: { url: string | null; name: string; size: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-14 w-14" : size === "md" ? "h-10 w-10" : "h-6 w-6";
  return url ? (
    <img src={url} alt={name} className={`${cls} rounded object-contain shrink-0`} />
  ) : (
    <div className={`${cls} rounded bg-muted shrink-0`} />
  );
}

function HeroCard({ team, rank }: { team: FrenzyTeamSummary; rank: number }) {
  const labelColor = RANK_LABEL_COLORS[rank - 1] ?? "text-muted-foreground";
  const borderColor = RANK_BORDER_COLORS[rank - 1] ?? "border-border";
  const bgColor = RANK_BG_COLORS[rank - 1] ?? "";

  return (
    <div className="shine-border rounded-xl" {...shineHandlers}>
      <Link to="/activities/frenzy/$teamSlug" params={{ teamSlug: team.slug }}>
        <Card className={`hover:border-primary/50 transition-colors cursor-pointer ${borderColor} ${bgColor}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-bold w-12 text-center shrink-0 ${labelColor}`}>
                #{rank}
              </span>
              <TeamIcon url={team.icon_url} name={team.name} size="lg" />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="font-rs-bold text-xl text-primary truncate">{team.name}</p>
                <TierBar tierPoints={team.tier_points} totalPoints={team.total_points} />
                <div className="flex items-center gap-3 flex-wrap">
                  {Object.entries(team.tier_points).map(([tier, pts]) => (
                    <span key={tier} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{tier}</span>{" "}
                      {Math.floor(pts).toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-3xl font-bold ${labelColor}`}>
                  {Math.floor(team.total_points).toLocaleString()}
                </p>
                {team.pending_points > 0 && (
                  <p className="text-sm text-muted-foreground/60">
                    +{Math.floor(team.pending_points).toLocaleString()} pending
                  </p>
                )}
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function StandardCard({ team, rank }: { team: FrenzyTeamSummary; rank: number }) {
  const labelColor = RANK_LABEL_COLORS[rank - 1] ?? "text-muted-foreground";
  const borderColor = RANK_BORDER_COLORS[rank - 1] ?? "border-border";

  return (
    <div className="shine-border rounded-xl" {...shineHandlers}>
      <Link to="/activities/frenzy/$teamSlug" params={{ teamSlug: team.slug }}>
        <Card className={`hover:border-primary/50 transition-colors cursor-pointer ${borderColor}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold w-8 text-center shrink-0 ${labelColor}`}>
                #{rank}
              </span>
              <TeamIcon url={team.icon_url} name={team.name} size="md" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="font-semibold truncate">{team.name}</p>
                <TierBar tierPoints={team.tier_points} totalPoints={team.total_points} />
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold">{Math.floor(team.total_points).toLocaleString()}</p>
                {team.pending_points > 0 && (
                  <p className="text-xs text-muted-foreground/60">
                    +{Math.floor(team.pending_points).toLocaleString()} pending
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function CompactCard({ team, rank }: { team: FrenzyTeamSummary; rank: number }) {
  return (
    <Link to="/activities/frenzy/$teamSlug" params={{ teamSlug: team.slug }}>
      <div className="rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-6 text-right shrink-0">#{rank}</span>
          <TeamIcon url={team.icon_url} name={team.name} size="sm" />
          <span className="flex-1 min-w-0 font-medium truncate text-sm">{team.name}</span>
          <div className="w-28 shrink-0">
            <TierBar tierPoints={team.tier_points} totalPoints={team.total_points} />
          </div>
          <span className="text-sm font-semibold shrink-0 w-20 text-right">
            {Math.floor(team.total_points).toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function FrenzyTeamCard({ team, rank, variant = "standard" }: Props) {
  if (variant === "hero") return <HeroCard team={team} rank={rank} />;
  if (variant === "compact") return <CompactCard team={team} rank={rank} />;
  return <StandardCard team={team} rank={rank} />;
}
