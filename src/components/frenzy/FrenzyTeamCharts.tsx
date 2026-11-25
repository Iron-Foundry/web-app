import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FrenzyFilterLine } from "./FrenzyFilterLine";
import { FrenzyPlayerChart } from "./FrenzyPlayerChart";
import { FrenzyPointsChart } from "./FrenzyPointsChart";
import { useTeamHistory } from "@/hooks/useFrenzy";
import { recomputeContribution, recomputeSeries, type TypeFilter } from "@/lib/frenzyCharts";

const TYPES: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "item", label: "Items" },
  { value: "activity", label: "Activities" },
  { value: "milestone", label: "Milestones" },
];

interface Props {
  id: string;
  teamSlug: string;
  participants: string[];
}

export function FrenzyTeamCharts({ id, teamSlug, participants }: Props): React.ReactElement {
  const [type, setType] = useState<TypeFilter>("all");
  const [player, setPlayer] = useState("all");
  const { data: history, isLoading } = useTeamHistory(teamSlug);
  const players = participants.length > 0 ? participants : Object.keys(history?.player_contribution ?? {});
  const filtered = history
    ? {
        ...history,
        series: recomputeSeries(history.series, type, player),
        player_contribution: recomputeContribution(history.series, type, player),
      }
    : null;

  return (
    <section id={id} className="scroll-mt-4 rounded-xl border bg-card p-5 space-y-4">
      <h2 className="font-rs-bold text-2xl text-primary">Charts</h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FrenzyFilterLine label="Type" options={TYPES} value={type} onChange={setType} />
        <Select value={player} onValueChange={setPlayer}>
          <SelectTrigger className="w-48" aria-label="Player">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All players</SelectItem>
            {players.map((rsn) => (
              <SelectItem key={rsn} value={rsn}>{rsn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading history...</p>}
      {filtered && (
        <>
          <h3 className="text-sm font-medium">Points over time</h3>
          <FrenzyPointsChart history={filtered} />
          <h3 className="text-sm font-medium">Player contribution</h3>
          <FrenzyPlayerChart history={filtered} />
        </>
      )}
    </section>
  );
}
