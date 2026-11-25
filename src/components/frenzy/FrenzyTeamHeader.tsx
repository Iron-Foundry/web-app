import { useState } from "react";
import { TeamIcon } from "./FrenzyStandings";
import type { FrenzyTeamDetail } from "@/types/frenzy";

const PREVIEW = 12;

function Participants({ names }: { names: string[] }): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? names : names.slice(0, PREVIEW);
  const more = names.length - PREVIEW;
  return (
    <p className="mt-1 text-sm text-muted-foreground">
      {shown.join(", ")}
      {more > 0 && (
        <button type="button" onClick={() => setExpanded(!expanded)} className="ml-2 text-primary hover:underline">
          {expanded ? "show less" : `+${more} more`}
        </button>
      )}
    </p>
  );
}

interface Props {
  detail: FrenzyTeamDetail;
  place: number | null;
  teamCount: number;
}

export function FrenzyTeamHeader({ detail, place, teamCount }: Props): React.ReactElement {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        <TeamIcon team={detail} className="h-16 w-16" />
        <div className="min-w-0">
          <h1 className="font-rs-bold text-3xl text-primary">{detail.name}</h1>
          {detail.participants.length > 0 && <Participants names={detail.participants} />}
        </div>
        <div className="col-span-2 sm:col-span-1 sm:text-right">
          <p className="text-3xl font-bold tabular-nums">
            {Math.floor(detail.scores.total).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">pts</span>
          </p>
          {detail.pending_points > 0 && <p className="text-xs text-sky-500">+{Math.floor(detail.pending_points).toLocaleString()} pending</p>}
          {place !== null && <p className="text-xs text-muted-foreground">#{place} of {teamCount}</p>}
        </div>
      </div>
    </div>
  );
}
