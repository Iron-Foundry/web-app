import { FrenzyTeamCard } from "./FrenzyTeamCard";
import type { FrenzyActiveEvent } from "@/types/frenzy";

interface Props {
  event: FrenzyActiveEvent;
}

export function FrenzyOverview({ event }: Props) {
  const sorted = [...event.teams].sort((a, b) => b.total_points - a.total_points);
  const [first, second, third, ...rest] = sorted;

  return (
    <div className="space-y-3">
      {first && <FrenzyTeamCard team={first} rank={1} variant="hero" />}
      {(second ?? third) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {second && <FrenzyTeamCard team={second} rank={2} />}
          {third && <FrenzyTeamCard team={third} rank={3} />}
        </div>
      )}
      {rest.length > 0 && (
        <div className="space-y-1.5">
          {rest.map((team, i) => (
            <FrenzyTeamCard key={team.id} team={team} rank={i + 4} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
