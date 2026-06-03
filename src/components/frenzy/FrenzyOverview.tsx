import { FrenzyTeamCard } from "./FrenzyTeamCard";
import type { FrenzyActiveEvent } from "@/types/frenzy";

interface Props {
  event: FrenzyActiveEvent;
}

export function FrenzyOverview({ event }: Props) {
  const sorted = [...event.teams].sort((a, b) => b.total_points - a.total_points);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sorted.map((team, i) => (
        <FrenzyTeamCard key={team.id} team={team} rank={i + 1} />
      ))}
    </div>
  );
}
